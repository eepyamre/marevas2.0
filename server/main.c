#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <uuid/uuid.h>
#include <hiredis/hiredis.h>
#include <ws.h>

#define _GNU_SOURCE
#define PORT 6969
redisContext *c;

void redisErrorCheck(redisReply *reply){
	if(reply == NULL && reply->type == REDIS_REPLY_ERROR){
		printf("Redis Error!\n");
		exit(1);
	}
}

void onopen(ws_cli_conn_t *client)
{
	char *cli, *port;
	cli  = ws_getaddress(client);
	port = ws_getport(client);
	#ifndef DISABLE_VERBOSE
		printf("Connection opened, addr: %s, port: %s\n", cli, port);
	#endif
	redisReply *reply;
	reply = redisCommand(c, "SMEMBERS layers");
	if (reply->type == REDIS_REPLY_ARRAY) {
		for (int i = 0; i < reply->elements; i++) {
			redisReply *title;
			redisReply *owner;
			title = redisCommand(c, "HGET layer-%s title", reply->element[i]->str);
			owner = redisCommand(c, "HGET layer-%s owner", reply->element[i]->str);
			redisErrorCheck(title);
			redisErrorCheck(owner);
			char message [100];
			snprintf(message, 100, "createlayer\n%s\n%s\n%s", owner->str, title->str, reply->element[i]->str);
			ws_sendframe_txt(client, message);
			freeReplyObject(title);
			freeReplyObject(owner);
		}
		freeReplyObject(reply);
	} else if(reply == NULL || reply->type == REDIS_REPLY_ERROR){
		printf("Redis Error!\n");
		exit(1);
	}
}

void onclose(ws_cli_conn_t *client)
{
	char *cli;
	cli = ws_getaddress(client);
#ifndef DISABLE_VERBOSE
	printf("Connection closed, addr: %s\n", cli);
#endif
}

void onmessage(ws_cli_conn_t *client,
	const unsigned char *msg, uint64_t size, int type)
{
	char *cli; 
	cli = ws_getaddress(client);

#ifndef DISABLE_VERBOSE
	printf("I receive a message: %s (size: %" PRId64 ", type: %d), from: %s\n",
		msg, size, type, cli);
#endif
	char for_strtok[size];
	strcpy(for_strtok, msg);
	char *action = strtok(for_strtok, "\n");
	char *layer_id = strtok(NULL, "\n");
	if(strcmp(action, "gethistory") == 0){
		char *history_layer_id = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c,"LRANGE %s-history 0 10", history_layer_id);

		if (reply->type == REDIS_REPLY_ARRAY) {
			char *res; 
			int size = asprintf(&res, "history\n%s", history_layer_id);
			if(size == -1){
				freeReplyObject(reply);
				printf("Cant allocate memory to copy and send history.");
				return;
			}
			for (int j = 0; j < reply->elements; j++) {
				int size = asprintf(&res, "%s\n%s", res, reply->element[j]->str);
				if(size == -1){
					printf("Cant allocate memory to copy and send history.");
					break;
				}
			}
			ws_sendframe_txt(client, res);
			if(res != NULL){
				free(res);
			}
		} else if(reply->type == REDIS_REPLY_ERROR){
			printf("Redis Error!\n");
			exit(1);
		}
		freeReplyObject(reply);
		return;
	} else if (strcmp(action, "createlayer") == 0) {
		char *username = layer_id;
		uuid_t binuuid;
		uuid_generate_random(binuuid);
		char *uuid = malloc(37);
		uuid_unparse_upper(binuuid, uuid);
		redisCommand(c, "SADD layers %s", uuid);
		redisReply *reply;
		reply = redisCommand(c, "SCARD layers");
		redisErrorCheck(reply);
		redisCommand(c, "HSET layer-%s id %s title Layer-%d owner %s", uuid, uuid, reply->integer, username);
		char message [100];
		snprintf(message, 100, "createlayer\n%s\nLayer-%d\n%s", username, reply->integer, uuid);	
		freeReplyObject(reply);
		ws_sendframe_txt_bcast(PORT, message);
	} else if(strcmp(action, "changelayerprops") == 0) {
		char *username = layer_id;
	} else if (strcmp(action, "deletelayer") == 0) {
		char *username = layer_id;
	} else if (strcmp(action, "setlayerowner") == 0) {
		char *username = layer_id;
	} else if (strcmp(action, "generateusername") == 0) {
		char *id = layer_id;
		char username [50];
		redisReply *reply;
		reply = redisCommand(c, "SCARD users");
		redisErrorCheck(reply);
		snprintf(username, 50, "Anon#%lld", reply->integer);
		freeReplyObject(reply);
		
		reply = redisCommand(c, "SADD users %s", username);
		redisErrorCheck(reply);
		freeReplyObject(reply);

		reply = redisCommand(c, "HSET %s key %s", username, id);
		redisErrorCheck(reply);
		freeReplyObject(reply);

		char message [100];
		snprintf(message, 100, "generateusername\n%s", username);	
		ws_sendframe_txt(client, message);
	} else if (strcmp(action, "checkusername") == 0) {
		char *username = layer_id;
		char *key = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HGET %s key", username);	
		redisErrorCheck(reply);
		if(reply->type != REDIS_REPLY_NIL && strcmp(reply->str, key) != 0){
			ws_sendframe_txt(client, "checkusernameerror");
		} else {
			ws_sendframe_txt(client, "checkusernamesuccess");
		}
		freeReplyObject(reply);
	} else {
		ws_sendframe_bcast(PORT, (char *)msg, size, type);
		char *ptr = strstr(msg, "data:image/");
		if(ptr != NULL){
			char copy[size];
			strcpy(copy, msg);
			redisReply *reply;
			reply = redisCommand(c,"SET %s %s", layer_id, copy);
			freeReplyObject(reply);
			reply = redisCommand(c,"LPUSH %s-history %s", layer_id, copy);
			freeReplyObject(reply);
			reply = redisCommand(c,"LTRIM %s-history 0 10", layer_id);
			if(reply == NULL || reply->type == REDIS_REPLY_ERROR){
				printf("Redis Error!\n");
				exit(1);
			}
			freeReplyObject(reply);
		}
	}
}

int main(void)
{
	c = redisConnect("127.0.0.1", 7777);
	if (c->err) {
    printf("error: %s\n", c->errstr);
  	return 1;
  }
	ws_socket(&(struct ws_server){
		.host = "0.0.0.0",
		.port = PORT,
		.thread_loop   = 0,
		.timeout_ms    = 1000,
		.evs.onopen    = &onopen,
		.evs.onclose   = &onclose,
		.evs.onmessage = &onmessage
	});

  redisFree(c);

	return 0;
}