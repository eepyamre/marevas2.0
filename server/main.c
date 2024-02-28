#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <ws.h>

#define PORT 6969
#define DISABLE_VERBOSE

char *users[100000];

char* strappend(char *str1, char *str2){
	char *new_str ;
	if((new_str = malloc(strlen(str1) + strlen(str2) + 1)) != NULL){
		new_str[0] = '\0'; 
		strcat(new_str,str1);
    strcat(new_str,str2);
	} else {
		fprintf(stderr, "malloc failed!\n");
		return NULL;
	}
	return new_str;
}

void onopen(ws_cli_conn_t *client)
{
	char *cli, *port;
	cli  = ws_getaddress(client);
	port = ws_getport(client);
	char message [20];
	snprintf(message, 100, "%sAinit", port);
#ifndef DISABLE_VERBOSE
	printf("Connection opened, addr: %s, port: %s\n", cli, port);
#endif
	ws_sendframe_txt(client, message);
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
	int portInt = atoi(port);
	char formattedMessage[size+1];
	snprintf(formattedMessage, size+1, "%sB", msg);
	if(users[portInt] != NULL){
		users[portInt] = strappend(users[portInt], formattedMessage);
	} else {
		users[portInt] = strappend((char *)"", formattedMessage);
	}
	// ON START DRAWING GET FROM redis(?) TO ARR 
	// ON END DRAW CLEAN users[portInt] and save to redis(?)
	// ON UNDO REDO SEND THE WHOLE HISTORY TO THE ALL USERS
	// WHEN USER DISCONNECTS SOMEHOW COMPRESS AND SAVE HIS RESULT NOT IN FORM OF HISTORY 
#ifndef DISABLE_VERBOSE
	printf("I receive a message: %s (size: %" PRId64 ", type: %d), from: %s\n",
		msg, size, type, cli);
#endif
	ws_sendframe_bcast(PORT, (char *)msg, size, type);
}

int main(void)
{
	ws_socket(&(struct ws_server){
		.host = "0.0.0.0",
		.port = PORT,
		.thread_loop   = 0,
		.timeout_ms    = 1000,
		.evs.onopen    = &onopen,
		.evs.onclose   = &onclose,
		.evs.onmessage = &onmessage
	});

	return (0);
}