# Connect several Macs

Each Mac runs its own model. Aevori routes complete requests to available machines
and shows which Mac answered. The pool supports up to eight machines and does
not combine their memory.

## Setup

1. Launch the latest AEVORI release on each Mac, or clone the public repository and run `npm ci`, `npm run build`, and `npm start`. Start Ollama and install at least one model.
2. On the additional Mac, create a session key under **Mac pool → Set up sharing**.
3. Open an SSH tunnel on the controlling Mac. Remote Login must already be configured on the additional Mac:

   ```sh
   ssh -N -L 5191:127.0.0.1:5190 USER@MAC.local
   ```

4. On the controlling Mac, choose **Mac pool → Connect a Mac**. Enter its name, `http://127.0.0.1:5191`, and the connection key. Each additional Mac needs a different local port, such as 5192 or 5193. An already secured HTTPS address also works.
5. Choose **Mac pool** in the chat's model selector. Automatic routing picks an available model on the assigned Mac. Image requests only go to models that explicitly report image support.

## Behavior and limits

Available machines take priority. Equally busy machines rotate. If a machine
fails before a response begins, Aevori can try another one. Once streaming starts,
a failure stops the response so outputs from different models are not mixed.

Sharing and connected machines last for the current session and must be set up
again after a server restart. Connection keys allow model requests and compact
device statistics, not file or process control. Keep keys out of Git, screenshots,
and public messages.

Aevori does not enable Remote Login or open public ports. Never copy `.aevori/`
between computers. All participating Macs need the current Aevori version so
model capabilities, including image support, are reported correctly.

[Back to Aevori](../README.md) · [Invite friends over HTTPS](../ONLINE.md)
