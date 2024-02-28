main: build_dep main.c
	gcc \
		-o server \
		main.c \
		-Wall \
		-I./wsServer/include -L./wsServer -lws \
		-I /usr/local/include/hiredis -lhiredis

build_dep: 
	make -C ./wsServer
	make -C ./hiredis
	make install -C ./hiredis

no_dep: 
	gcc \
		-o server \
		main.c \
		-Wall \
		-I./wsServer/include -L./wsServer -lws \
		-I /usr/local/include/hiredis -lhiredis