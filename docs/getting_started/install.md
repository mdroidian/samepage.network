---
title: How to Install SamePage!
description: Learn how to bring the SamePage Network into your application of choice!
---

SamePage is composed of two parts: app extensions and the network. As a user, you will need to install the SamePage extension available in your application of choice in order to gain access to the network. The network is what communicates between tools to bring you features such as cross-app syncing, cross-app querying, and more!

We have listed the installation instructions for each application under the applications heading on the left. A quick summary of how to install the extension in each app is also available in our [install](/install) page.

During each of these docs, we reference two versions of the SamePage extension.

The **Live** version is the version that we officially support and are reviewed by the companies behind the host application. This is the primary version meant for everyday users.

The **Development** version is version that will be up to date with all changes to the extension, giving users a sneak peak of what's to come. Those versions are downloadable from the SamePage website. They are meant for more technical users and contributors helping to test future versions of SamePage extensions before they become live.

## Onboarding

After installing the extension you will immediately be taken into the SamePage onboarding flow.

![](/images/docs/getting-started/onboarding-start.png)

Click on the button on the right to get started with connecting your first notebook:

![](/images/docs/getting-started/onboarding-create.png)

Create your SamePage account by entering your email address and adding a password. This will automatically link the current application you're using as a Notebook tied to your account. Make sure to also check the flag ensuring you agree to SamePage's terms and conditions:

![](/images/docs/getting-started/onboarding-invite.png)

Once you hit create, you should be greeted with a confirmation screen affirming that your Notebook is all set up!

![](/images/docs/getting-started/onboarding-success.png)

You will then be automatically connected to the SamePage network & can start using SamePage! This onboarding flow should not appear again as the credentials it generated are now saved to your notebook.

## Onboarding Additional Notebooks

Notebooks are the main concept integral to SamePage. A Notebook is composed of two parts:

- An **App** - this is the host application which you are using as a tool for thought. Examples include Roam, LogSeq, & Obsidian, and we are looking to support more in the future.
- A **Workspace** - this is the container of data within the app you are using. Examples are your graph name in Roam & LogSeq, or your vault name in Obsidian.

When you onboard a new Notebook onto SamePage, you are issued a new **Univeral Id** and a new **Token**. The Universal Id belongs to the Notebook you are using and identifies the notebook to the rest of the network. The Token belongs to you as a user and is granting your notebook access to use features on the network. **This token is considered sensitive data and should be kept safe.** If unauthorized parties were to gain access to it, they would be able to manipulate data in your Notebook.

To onboard a new Notebook, the same onboarding modal will appear upon installing the extension to the new Notebook. This time, you will want to click the left button to `Add Another Notebook`.

You will be prompted to enter your email and password so that we can identify you as a user and know that you are authorized to connect a new Notebook.

![](/images/docs/getting-started/onboarding-connect.png)

Once you hit connect, you will arrive to the same success screen and will be ready to use SamePage in this notebook. If this is a Notebook on a different application or different workspace name, it will receive a new Notebook Universal ID, but the Token will remain the same. If this is a Notebook on the same application with the same workspace name (say, because it was in a different browser or different device), it will be linked via the same Notebook Universal ID.

On the free plan, each token is allowed a maximum of 3 notebooks and 100 shared pages per notebook.
