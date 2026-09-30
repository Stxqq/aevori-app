# Share AEVORI

Public preview: [github.com/Stxqq/aevori-app](https://github.com/Stxqq/aevori-app)

## X — launch post

I’m building AEVORI: a local AI workspace for Mac. Chat with Ollama, give your agent a character, and choose what it remembers.

Apple silicon + Intel preview. Models installed separately.

Try it: https://github.com/Stxqq/aevori-app

Attach `media/aevori-reply.mp4`. Ask people to try the app, not to inflate votes.

## LinkedIn — launch post

**Meet AEVORI — Intelligence, locally.**

I wanted a calmer place to work with local AI: a conversation, a character of your
own, and useful context you can actually inspect and delete.

AEVORI runs on your Mac and opens in your browser. It brings together:

- Streaming chat with local Ollama models, including image-capable models.
- A customizable agent with persistent messages and controllable memory.
- Notes, tasks, and proposed actions that you review before applying.
- Dark, light, and sand themes, with gentle character and chat animations.
- Ready-to-run downloads for Apple silicon and Intel Macs.

It is an early, unsigned preview. Ollama and model weights are installed
separately. The agent handles supported in-app work; it does not control your
browser, email, or payments. Optional cloud providers are clearly separate from
local inference.

The repository has a real reply GIF, installation steps, source, tests, and known
limitations. I’d love feedback on the first-run experience and which local models
work well on your Mac.

Try it: https://github.com/Stxqq/aevori-app

## Developer community — technical introduction

**Title:** AEVORI: local Ollama chat and a personal agent for macOS

I’m the developer of AEVORI, a browser-based workspace served by a local Node
process on your Mac. The local agent uses Ollama; its memory is inspectable stored
context, not model training. It can propose notes and tasks, with server-side
approval checks before they are applied.

I’m looking for practical feedback from people already running Ollama on a Mac:

1. Is the download → launcher → first response flow clear?
2. Which model and RAM configuration did you try?
3. Are the memory and approval controls understandable?

The public preview includes Apple silicon and Intel downloads, an English UI, and
36 protocol/persistence/access-boundary tests. The Apple-silicon archive was
launched locally; the Intel archive is packaged but still needs an Intel tester.
The preview is unsigned. Code is MIT licensed with documented asset and
third-party exclusions.

Repo and actual reply recording: https://github.com/Stxqq/aevori-app

Use this in a community that permits project showcases, disclose ownership, and
check its current rules before posting. For Show HN, the developer should write
the introduction in their own words and be available to discuss the work; read
[the official guidelines](https://news.ycombinator.com/showhn.html). A working
release is available; avoid presenting an update alone as a new launch.

## Launch sequence

- Lead with the real reply video and one concrete benefit: local chat with
  controllable memory. Link directly to the repository and tested download.
- Publish from the selected personal account first. Reply to genuine setup
  questions and collect model, RAM, and macOS details from willing testers.
- Share once in a relevant project-showcase community when its rules and the
  account’s participation permit it. Tailor the introduction to that audience.
- Follow up with an actual fix or measured result after gathering feedback.
  Keep claims tied to shipped behavior; do not imply browser automation or SMS.
- Compare GitHub unique visitors, clones, release downloads, and actionable
  feedback before and after the launch. A Trending position is not a promised
  outcome. This is a manual launch plan, not a scheduled posting campaign.

## Media

- Header / link preview: `media/aevori-code-banner.png`
- H.264 video for social uploads: `media/aevori-reply.mp4`
- Real reply recording: `media/aevori-reply.gif`
- English app screenshot: `media/aevori-agent-dark.png`

These are drafts for an appropriate account or community, not automatically
published posts. Follow the destination’s self-promotion rules and disclose that
you are the project’s creator. Describe the project as MIT-licensed code with the
asset and third-party exclusions documented in the repository.
