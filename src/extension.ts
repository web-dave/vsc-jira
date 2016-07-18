'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as historyUtil from './historyUtils';
import * as path from 'path';
import * as fs from 'fs';
let JiraApi = require('jira-client');




export function activate(context: vscode.ExtensionContext) {


    console.log('Congratulations, your extension "jira" is now active!');
    let commits: any[];
    let cwd = vscode.workspace.rootPath;
    let issueNumber: string;

    let comment = vscode.commands.registerCommand('extension.jiraCommit', () => {

        let jira_conf = vscode.workspace.getConfiguration('jira');
        console.log(jira_conf);
        if (jira_conf['host'] !== undefined) {
            vscode.window.showInputBox({ placeHolder: 'ID of a Issue' }).then((data) => {
                if ((data !== undefined) && (data !== null)) {
                    issueNumber = data;

                    historyUtil.getGitRepositoryPath(vscode.window.activeTextEditor.document.fileName).then((gitRepositoryPath) => {

                        historyUtil.gitLog(gitRepositoryPath, []).then((log) => {
                            commits = log;
                            let comment: string;
                            let items = [];
                            for (let l in log) {
                                items.push(log[l].message)
                            }
                            let options = { matchOnDescription: false, placeHolder: "select Commit" };

                            vscode.window.showQuickPick(items, options).then((data) => {

                                comment = historyUtil.parseLog(commits[items.indexOf(data)]);

                                console.log(comment);

                                let jira = new JiraApi(jira_conf);

                                jira.findIssue(issueNumber).then((issue) => {
                                    jira.addComment(issueNumber, comment).then((ret) => {
                                        console.log(ret);

                                    }).catch((err) => {
                                        console.error(err);
                                        vscode.window.showErrorMessage(`ERROR: comment Issue ${issueNumber}: ${err}`);
                                    });
                                }).catch((err) => {
                                    vscode.window.showErrorMessage(`ERROR: Issue ${issueNumber} not found!`);
                                });
                            })

                        }, (err) => {
                            vscode.window.showErrorMessage('ERROR: ' + err);
                        });


                    }, (err) => {
                        vscode.window.showErrorMessage('ERROR: ' + err);
                    });
                }
            })
        } else {
            vscode.window.showErrorMessage('ERROR: no config file at' + `${cwd}/.vscode/jira.json`);
        }
    });

    context.subscriptions.push(comment);
}

// this method is called when your extension is deactivated
export function deactivate() {
}