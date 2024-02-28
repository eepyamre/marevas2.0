main: main.c wsServer 
	make -C ./wsServer
	gcc -o server main.c -Wall -I./wsServer/include -L./wsServer -lws 