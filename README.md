# marevas 2

Just a shared canvas for drawing mare snowpities online free no registration no sms anonymously

## Why

because my small shared isntance of kleks sucked at marecon '24

## Requirements

- redis-server

## Quick Start

### Run redis at port 7777

```bash
redis-server -p 7777
```

### Run server

```bash
cd server && make
./server
```

### Run client

```bash
# in the root directory
npm run start
```

## Dependencies

### server

- [wsServer](https://github.com/Theldus/wsServer/tree/master)
- [hiredis](https://github.com/redis/hiredis)

### client

- [uuid](https://www.npmjs.com/package/uuid)
