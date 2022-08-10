---
title: SamePage Docs - Roam Installation
description: Install SamePage into your Roam Graph
---

Welcome to the SamePage Network! 

## Overview
The SamePage Network (formerly known as RoamJS Multiplayer) extension allows you to connect your Roam Graph to other notebooks using the SamePage Network.

Throughout these docs, you'll see the term 'notebook'. A 'notebook' is a 'workspace' within an 'app'. 
'Apps' include various tools for thought, like Roam, LogSeq, and Obsidian. 
A 'workspace' is an a single instantiation of those 'apps' like a graph or a vault, signified by the __name__. 

So the internal [Roam Help Graph](https://roamresearch.com/#/app/help/page/fCaJekIoX) is an example of a 'notebook'. Your personal Roam graph or Obsidian vault named "Metacognition Research" are other examples.

Below are instructions to install SamePage into your Roam graph. 

## Installation
You could use the Copy Extension button below to individually install this extension. To install, just paste anywhere in your Roam graph and click "Yes, I Know What I'm Doing".

### Manual Installation
If the extension doesn't work after using the copy extension button above, try installing manually using the instructions below.

First create a block with the text {{[[roam/js]]}} on any page in your Roam DB. Then, create a single child of this block and type three backticks. A code block should appear. Copy this code and paste it into the child code block in your graph:

``` var existing = document.getElementById("roamjs-multiplayer");
if (!existing) {
  var extension = document.createElement("script");
  extension.src = "https://roamjs.com/multiplayer/main.js";
  extension.id = "roamjs-multiplayer";
  extension.async = true;
  extension.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(extension);
} ```

Finally, click "Yes, I Know What I'm Doing".
