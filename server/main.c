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
char users[1000][40];
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
	snprintf(message, 100, "%sAinit", uuid);
	strcpy(users[iota++], uuid);
#ifndef DISABLE_VERBOSE
	printf("Connection opened, addr: %s, port: %s\n", cli, port);
#endif
	ws_sendframe_txt(client, message);
	for (int i = 0; i < 1000; i++){
		if(users[i][0] == '\0'){ break; }
		redisReply *reply;
		reply = redisCommand(c, "GET %s", users[i]);
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
	ws_sendframe_bcast(PORT, (char *)msg, size, type);

	char *ptr = strstr(msg, "data:image/");
	
	if(ptr != NULL){
		char copy[size];
		strcpy(copy, msg);
		char *user_id = strtok(msg, "A");
		redisReply *reply;
		reply = redisCommand(c,"SET %s %s", user_id, copy);
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