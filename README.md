# jira

With this extension you can add git commit to your jira issue as a comment.
It consumes  the [node-jira-client](https://github.com/jira-node/node-jira-client) and i greb some code from
[Git History](https://marketplace.visualstudio.com/items?itemName=donjayamanne.githistory).

You need some config in your `.vscode` folder.


So create a `jira.json`:
```
{
    "protocol": "https",
    "host": <URL>,
    "username": <username>,
    "password": <password>,
    "apiVersion": "2",
    "strictSSL": true
}
```
and replace the placeholder with your informations.

# Be sure to set jira.json  in your .gitignore!

## Install

In Visual Studio Code, simply hit  CMD/CTRL + Shift + P , search for "Install Extension", and then search for "vsc-jira".

## run

- simply hit  CMD/CTRL + Shift + P and type jira
- you'll find `jira issue add git commit as comment`
- select type your jira issue number
- select a jira commit from the list

**have fun**
