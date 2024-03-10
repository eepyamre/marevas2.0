#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <hiredis/hiredis.h>
#include <ws.h>

#define PORT 6969
#define DISABLE_VERBOSE
// TODO: MOVE TO REDIS TOO
char layers[1000][40];
int iota = 0;
redisContext *c;

// https://stackoverflow.com/a/71826534
char* gen_uuid() {
    char v[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};
    //3fb17ebc-bc38-4939-bc8b-74f2443281d4
    //8 dash 4 dash 4 dash 4 dash 12
    static char buf[37] = {0};

    //gen random for all spaces because lazy
    for(int i = 0; i < 36; ++i) {
        buf[i] = v[rand()%16];
    }

    //put dashes in place
    buf[8] = '-';
    buf[13] = '-';
    buf[18] = '-';
    buf[23] = '-';

    //needs end byte
    buf[36] = '\0';

    return buf;
}

void onopen(ws_cli_conn_t *client)
{
	char *cli, *port;
	cli  = ws_getaddress(client);
	port = ws_getport(client);
	char message [50];
	char *uuid = gen_uuid();
	snprintf(message, 100, "%s\ninit", uuid);
	strcpy(layers[iota++], uuid);
#ifndef DISABLE_VERBOSE
	printf("Connection opened, addr: %s, port: %s\n", cli, port);
#endif
	ws_sendframe_txt(client, message);
	for (int i = 0; i < 1000; i++){
		if(layers[i][0] == '\0'){ break; }
		redisReply *reply;
		reply = redisCommand(c, "GET %s", layers[i]);
		if(reply != NULL && reply->type == REDIS_REPLY_STRING){
			ws_sendframe_txt(client, reply->str);
			freeReplyObject(reply);
		}
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
	char *cli, *port;
	cli = ws_getaddress(client);
	port = ws_getport(client);

#ifndef DISABLE_VERBOSE
	printf("I receive a message: %s (size: %" PRId64 ", type: %d), from: %s\n",
		msg, size, type, cli);
#endif
	char for_strtok[size];
	strcpy(for_strtok, msg);
	char *layer_id = strtok(for_strtok, "\n");
	char *action = strtok(NULL, "\n");
	if(strcmp(action, "gethistory") == 0){
		char *history_layer_id = strtok(NULL, "\n");
		redisReply *reply;
		reply = redisCommand(c,"LRANGE %s-history 0 10", history_layer_id);

		if (reply->type == REDIS_REPLY_ARRAY) {
			char *res; 
			int size = asprintf(&res, "%s\nhistory", history_layer_id);
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
		}
		freeReplyObject(reply);
		return;
	}
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
		freeReplyObject(reply);
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