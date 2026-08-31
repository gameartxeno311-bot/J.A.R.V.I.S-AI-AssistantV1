# API

## GET /api/assistant/status
Returns service status and registered tool count.

## POST /api/assistant/message
```json
{"userId":"user-1","conversationId":"conversation-1","message":"Good morning"}
```

## GET /api/tools
Lists registered tools and their risk/confirmation metadata.

## POST /api/tools/execute
```json
{"userId":"user-1","tool":"filesystem.list_files","input":{"path":"./workspace"},"confirmed":false}
```

High-risk tools are rejected unless `confirmed` is true.

## GET /api/memory?userId=user-1&q=project
Searches relevant persisted memory.

## POST /api/memory
Creates an explicitly supplied memory record. Production deployments should put this endpoint behind authentication and authorization.
