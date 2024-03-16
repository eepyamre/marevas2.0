main: build_dep main.c
	CFLAGS="-DVERBOSE_MODE" gcc \
		-o server \
		main.c \
		-Wall \
		-I./wsServer/include -L./wsServer -lws -luuid \
		-I /usr/local/include/hiredis -lhiredis \
		-pthread \
		-std=gnu99 \
		-O3

build_dep: 
	make -C ./wsServer
	make -C ./hiredis
	make install -C ./hiredis

no_dep: 
	CFLAGS="-DVERBOSE_MODE" gcc \
		-o server \
		main.c \
		-Wall \
		-I./wsServer/include -L./wsServer -lws -luuid \
		-I /usr/local/include/hiredis -lhiredis \
		-pthread \
		-std=gnu99 \
		-O3