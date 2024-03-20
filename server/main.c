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

// actions
#define ACTION_GET_HISTORY "1"
#define ACTION_CREATE_LAYER "2"
#define ACTION_SET_LAYER_OPACITY "3"
#define ACTION_DELETE_LAYER "4"
#define ACTION_SET_LAYER_OWNER "5"
#define ACTION_GENERATE_USER_NAME "6"
#define ACTION_LOGIN "7"
#define ACTION_CHECK_USERNAME "8"
#define ACTION_SAVE_IMAGE "9"
#define ACTION_HISTORY "10"
#define ACTION_LAYER_OWNER_CHAGNGE "11"
#define ACTION_LOGIN_SUCCESS "12"
#define ACTION_LOGIN_ERROR "13"
#define ACTION_CHECK_USERNAME_ERROR "14"
#define ACTION_CHECK_USERNAME_SUCCESS "15"
#define ACTION_POSITION "16"
#define ACTION_START "17"
#define ACTION_STOP "18"
#define ACTION_IMAGE "19"

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
			int size = asprintf(&message, "%s\n%s\n%s\n%s\n%s\n%s", ACTION_CREATE_LAYER, owner->str, 
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
	if (strcmp(action, ACTION_GET_HISTORY) == 0)
	{
		char *history_layer_id = username;
		redisReply *reply;
		reply = redisCommand(c, "LRANGE layer-%s-history 0 10", history_layer_id);

		if (reply->type == REDIS_REPLY_ARRAY)
		{
			char *res;
			int size = asprintf(&res, "%s\n%s", ACTION_HISTORY, history_layer_id);
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
	else if (strcmp(action, ACTION_CREATE_LAYER) == 0)
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
		snprintf(message, 100, "%s\n%s\nLayer-%d\n%s", ACTION_CREATE_LAYER, username, reply->integer, uuid);
		freeReplyObject(reply);
		ws_sendframe_txt_bcast(PORT, message);
	}
	else if (strcmp(action, ACTION_SET_LAYER_OPACITY) == 0)
	{
		char *layer_id = strtok(NULL, "\n");
		char *opacity = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HSET layer-%s opacity %s", layer_id, opacity);
		redisErrorCheck(reply);
		freeReplyObject(reply);
		char message[200];
		snprintf(message, 200, "%s\n%s\n%s\n%s", ACTION_SET_LAYER_OPACITY, username, layer_id, opacity);
		ws_sendframe_txt_bcast(PORT, message);
	}
	else if (strcmp(action, ACTION_DELETE_LAYER) == 0)
	{
		char *layer_id = strtok(NULL, "\n");
		redisReply *owner;
		owner = redisCommand(c, "HGET layer-%s owner", layer_id);
		redisErrorCheck(owner);
		if(strcmp(owner->str, username) == 0){
			redisCommand(c, "SREM layers %s", layer_id);
			redisCommand(c, "DEL layer-%s", layer_id);
			redisCommand(c, "DEL layer-%s-history", layer_id);
			char message[200];
			snprintf(message, 200, "%s\n%s\n%s", ACTION_DELETE_LAYER, username, layer_id);
			ws_sendframe_txt_bcast(PORT, message);
		}
		freeReplyObject(owner);
	}
	else if (strcmp(action, ACTION_SET_LAYER_OWNER) == 0)
	{
	}
	else if (strcmp(action, ACTION_GENERATE_USER_NAME) == 0)
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
		snprintf(message, 100, "%s\n%s", ACTION_GENERATE_USER_NAME, username_new);
		ws_sendframe_txt(client, message);
	}
	else if (strcmp(action, ACTION_LOGIN) == 0){
		char *pass = strtok(NULL, "\n");
		char *key = strtok(NULL, "\n");
		char *prev_username = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HGET %s pass", username);
		redisErrorCheck(reply);
		int b = 0;
		if (reply->type == REDIS_REPLY_NIL)
		{
			b = 1;
			redisCommand(c, "HSET %s pass %s key %s", username, pass, key);
		}
		else if (strcmp(reply->str, pass) == 0)
		{
			b = 1;
			redisCommand(c, "HSET %s key %s", username, key);
		} else {
			ws_sendframe_txt(client, ACTION_LOGIN_ERROR);
		}
		freeReplyObject(reply);
		if(b == 1){
			char *message;
			int size = asprintf(&message, "%s\n%s\n%s", ACTION_LOGIN_SUCCESS, username, key);
			if (size == -1)
			{
				printf("Cant allocate memory.");
				return;
			}
			ws_sendframe_txt(client, message);
			redisReply *layers;
			layers = redisCommand(c, "SMEMBERS layers");
			redisErrorCheck(layers);
			if (layers->type == REDIS_REPLY_ARRAY)
			{
				for (int i = 0; i < layers->elements; i++)
				{
					redisReply *owner;
					owner = redisCommand(c, "HGET layer-%s owner", layers->element[i]->str);
					redisErrorCheck(owner);
					if(strcmp(owner->str, prev_username) == 0){
						redisCommand(c, "HSET layer-%s owner %s", layers->element[i]->str, username);
						char *message;
						int size = asprintf(&message, "%s\n%s\n%s",ACTION_LAYER_OWNER_CHAGNGE, username, layers->element[i]->str);
						if (size == -1)
						{
							freeReplyObject(owner);
							printf("Cant allocate memory.");
							continue;
						}
						ws_sendframe_txt_bcast(PORT, message);
					}
					freeReplyObject(owner);
				}
				freeReplyObject(layers);
			}
		}
	}
	else if (strcmp(action, ACTION_CHECK_USERNAME) == 0)
	{
		char *key = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c, "HGET %s key", username);
		redisErrorCheck(reply);
		if (reply->type == REDIS_REPLY_NIL || strcmp(reply->str, key) != 0)
		{
			ws_sendframe_txt(client, ACTION_CHECK_USERNAME_ERROR);
		}
		else
		{
			ws_sendframe_txt(client, ACTION_CHECK_USERNAME_SUCCESS);
		}
		freeReplyObject(reply);
	}
	else
	{
		if(strcmp(action, ACTION_SAVE_IMAGE) != 0){
			ws_sendframe_bcast(PORT, (char *)msg, size, type);
		}
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