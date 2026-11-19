"""Hugging Face Gradio wrapper: runs the Node/Express service (server.js) and forwards every request to it.
Gradio itself is only a stub at /gradio; the real app is the Express server."""
import os
import shutil
import subprocess
import sys
import time

import gradio as gr
import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import Response, StreamingResponse
from starlette.background import BackgroundTask

HERE = os.path.dirname(os.path.abspath(__file__))
NODE_PORT = 3001
UPSTREAM = f"http://127.0.0.1:{NODE_PORT}"


def node_paths():
    """System node if present, else the one bundled in the nodejs-wheel-binaries pip package."""
    node = shutil.which("node")
    if node:
        return node, [shutil.which("npm") or "npm"]
    import nodejs_wheel.executable as ex

    root = ex.ROOT_DIR
    node = os.path.join(root, "bin", "node")
    return node, [node, os.path.join(root, "lib", "node_modules", "npm", "bin", "npm-cli.js")]


def start_node():
    node, npm = node_paths()
    if not os.path.isdir(os.path.join(HERE, "node_modules", "express")):
        subprocess.run([*npm, "install", "--omit=dev", "--no-audit", "--no-fund"], cwd=HERE, check=True)
    env = {**os.environ, "PORT": str(NODE_PORT), "PATH": os.path.dirname(node) + os.pathsep + os.environ.get("PATH", "")}
    return subprocess.Popen([node, "server.js"], cwd=HERE, env=env)


node_proc = start_node()
for _ in range(60):  # wait until Express answers
    try:
        httpx.get(f"{UPSTREAM}/api/health", timeout=1)
        break
    except Exception:
        time.sleep(0.5)

client = httpx.AsyncClient(base_url=UPSTREAM, timeout=None)
HOP = {"host", "connection", "keep-alive", "transfer-encoding", "te", "upgrade", "proxy-authorization", "proxy-authenticate", "trailers", "content-length"}

app = FastAPI()

with gr.Blocks() as demo:
    gr.Markdown("Zenkai Movies service is running. API: `/api/health`")
app = gr.mount_gradio_app(app, demo, path="/gradio")


@app.api_route("/{path:path}", methods=["GET", "HEAD", "POST", "OPTIONS"])
async def forward(path: str, request: Request):
    req = client.build_request(
        request.method,
        "/" + path,
        params=request.query_params,
        headers=[(k, v) for k, v in request.headers.items() if k.lower() not in HOP],
        content=await request.body(),
    )
    up = await client.send(req, stream=True)
    headers = {k: v for k, v in up.headers.items() if k.lower() not in HOP and k.lower() != "content-encoding"}
    if request.method == "HEAD":
        await up.aclose()
        return Response(status_code=up.status_code, headers=headers)
    return StreamingResponse(up.aiter_raw(), status_code=up.status_code, headers={**headers, **({"content-encoding": up.headers["content-encoding"]} if "content-encoding" in up.headers else {})}, background=BackgroundTask(up.aclose))


if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 7860)))
    finally:
        node_proc.terminate()
