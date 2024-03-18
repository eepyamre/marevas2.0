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

void redisErrorCheck(redisReply *reply)
{
	if (reply == NULL && reply->type == REDIS_REPLY_ERROR)
	{
		printf("Redis Error!\n");
		exit(1);
	}
}

void onopen(ws_cli_conn_t *client)
{
	char *cli, *port;
	cli = ws_getaddress(client);
	port = ws_getport(client);
#ifndef DISABLE_VERBOSE
	printf("Connection opened, addr: %s, port: %s\n", cli, port);
#endif
	redisReply *reply;
	reply = redisCommand(c, "SMEMBERS layers");
	if (reply->type == REDIS_REPLY_ARRAY)
	{
		for (int i = 0; i < reply->elements; i++)
		{
			redisReply *title;
			redisReply *owner;
			redisReply *data;
			redisReply *opacity;
			title = redisCommand(c, "HGET layer-%s title", reply->element[i]->str);
			owner = redisCommand(c, "HGET layer-%s owner", reply->element[i]->str);
			data = redisCommand(c, "HGET layer-%s data", reply->element[i]->str);
			opacity = redisCommand(c, "HGET layer-%s opacity", reply->element[i]->str);
			redisErrorCheck(title);
			redisErrorCheck(owner);
			redisErrorCheck(data);
			redisErrorCheck(opacity);
			char *message;
			int size = asprintf(&message, "createlayer\n%s\n%s\n%s\n%s\n%s", owner->str, 
			title->str, reply->element[i]->str, data->str, opacity->str);
			if (size == -1)
			{
				freeReplyObject(reply);
				printf("Cant allocate memory to copy and send image.");
			}
			ws_sendframe_txt(client, message);
			freeReplyObject(title);
			freeReplyObject(owner);
			freeReplyObject(data);
		}
		freeReplyObject(reply);
	}
	else if (reply == NULL || reply->type == REDIS_REPLY_ERROR)
	{
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
	char *username = strtok(NULL, "\n");
	if (strcmp(action, "gethistory") == 0)
	{
		char *history_layer_id = username;
		redisReply *reply;
		reply = redisCommand(c, "LRANGE layer-%s-history 0 10", history_layer_id);

		if (reply->type == REDIS_REPLY_ARRAY)
		{
			char *res;
			int size = asprintf(&res, "history\n%s", history_layer_id);
			if (size == -1)
			{
				freeReplyObject(reply);
				printf("Cant allocate memory to copy and send history.");
				return;
			}
			for (int j = 0; j < reply->elements; j++)
			{
				int size = asprintf(&res, "%s\n%s", res, reply->element[j]->str);
				if (size == -1)
				{
					printf("Cant allocate memory to copy and send history.");
					break;
				}
			}
			ws_sendframe_txt(client, res);
			if (res != NULL)
			{
				free(res);
			}
		}
		else if (reply->type == REDIS_REPLY_ERROR)
		{
			printf("Redis Error!\n");
			exit(1);
		}
		freeReplyObject(reply);
		return;
	}
	else if (strcmp(action, "createlayer") == 0)
	{
		uuid_t binuuid;
		uuid_generate_random(binuuid);
		char *uuid = malloc(37);
		uuid_unparse_upper(binuuid, uuid);
		redisCommand(c, "SADD layers %s", uuid);
		redisReply *reply;
		reply = redisCommand(c, "SCARD layers");
		redisErrorCheck(reply);
		redisCommand(c, "HSET layer-%s id %s title Layer-%d owner %s opacity 1", uuid, uuid, reply->integer, username);
		char message[100];
		snprintf(message, 100, "createlayer\n%s\nLayer-%d\n%s", username, reply->integer, uuid);
		freeReplyObject(reply);
		ws_sendframe_txt_bcast(PORT, message);
	}
	else if (strcmp(action, "setlayeropacity") == 0)
	{
		char *layer_id = strtok(NULL, "\n");
		char *opacity = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HSET layer-%s opacity %s", layer_id, opacity);
		redisErrorCheck(reply);
		freeReplyObject(reply);
		char message[200];
		snprintf(message, 200, "setlayeropacity\n%s\n%s\n%s", username, layer_id, opacity);
		ws_sendframe_txt_bcast(PORT, message);
	}
	else if (strcmp(action, "deletelayer") == 0)
	{
		char *layer_id = strtok(NULL, "\n");
		redisCommand(c, "SREM layers %s", layer_id);
		redisCommand(c, "DEL layer-%s", layer_id);
		redisCommand(c, "DEL layer-%s-history", layer_id);
		char message[200];
		snprintf(message, 200, "deletelayer\n%s\n%s", username, layer_id);
		ws_sendframe_txt_bcast(PORT, message);
	}
	else if (strcmp(action, "setlayerowner") == 0)
	{
	}
	else if (strcmp(action, "generateusername") == 0)
	{
		char *id = username;
		char username_new[50];
		redisReply *reply;
		reply = redisCommand(c, "SCARD users");
		redisErrorCheck(reply);
		snprintf(username_new, 50, "Anon#%lld", reply->integer);
		freeReplyObject(reply);

		reply = redisCommand(c, "SADD users %s", username_new);
		redisErrorCheck(reply);
		freeReplyObject(reply);

		reply = redisCommand(c, "HSET %s key %s", username_new, id);
		redisErrorCheck(reply);
		freeReplyObject(reply);

		char message[100];
		snprintf(message, 100, "generateusername\n%s", username_new);
		ws_sendframe_txt(client, message);
	}
	else if (strcmp(action, "checkusername") == 0)
	{
		char *key = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HGET %s key", username);
		redisErrorCheck(reply);
		if (reply->type != REDIS_REPLY_NIL && strcmp(reply->str, key) != 0)
		{
			ws_sendframe_txt(client, "checkusernameerror");
		}
		else
		{
			ws_sendframe_txt(client, "checkusernamesuccess");
		}
		freeReplyObject(reply);
	}
	else
	{
		ws_sendframe_bcast(PORT, (char *)msg, size, type);
		char *layer_id = strtok(NULL, "\n");
		char *ptr = strstr(msg, "data:image/");
		if (ptr != NULL)
		{
			char copy[size];
			strcpy(copy, ptr);
			redisReply *reply;
			reply = redisCommand(c, "HSET layer-%s data %s", layer_id, copy);
			freeReplyObject(reply);
			reply = redisCommand(c, "LPUSH layer-%s-history %s", layer_id, copy);
			freeReplyObject(reply);
			reply = redisCommand(c, "LTRIM layer-%s-history 0 10", layer_id);
			if (reply == NULL || reply->type == REDIS_REPLY_ERROR)
			{
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
	if (c->err)
	{
		printf("error: %s\n", c->errstr);
		return 1;
	}
	ws_socket(&(struct ws_server){
			.host = "0.0.0.0",
			.port = PORT,
			.thread_loop = 0,
			.timeout_ms = 1000,
			.evs.onopen = &onopen,
			.evs.onclose = &onclose,
			.evs.onmessage = &onmessage});

	redisFree(c);

	return 0;
}