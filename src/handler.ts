"use strict";

import * as vscode from "vscode";
import * as historyUtil from "./historyUtils";

import { JiraClient } from "./jira";
import { InputBoxOptions, QuickPickItem } from "vscode";

/**
 * vscode util class.
 * 
 * @export
 * @class Handler
 */
export class Handler {

    /**
     * Show error message.
     * 
     * @static
     * @param {any} error
     * @memberof Handler
     */
    public static error (error): void {
        vscode.window.showErrorMessage(error);
    }

    /**
     * vscode input box.
     * 
     * @static
     * @param {InputBoxOptions} options
     * @returns {Promise<string>}
     * @memberof Handler
     */
    public static inputBox(options: InputBoxOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            vscode.window.showInputBox(options).then(data => {
                if (data) {
                    resolve(data);
                } else {
                    reject();
                }
            });
        });
    }

    /**
     * Add comment for issue.
     * 
     * @static
     * @memberof Handler
     */
    public static addCommentForIssue (client: JiraClient): void {
        this.inputBox({ placeHolder: "ID of a Issue" }).then((data) => {
            if ((data !== undefined) && (data !== null)) {
                let issueNumber = data;

                historyUtil.getGitRepositoryPath(vscode.window.activeTextEditor.document.fileName).then((gitRepositoryPath) => {

                    historyUtil.gitLog(gitRepositoryPath, []).then((log) => {
                        let comment: string;
                        let items = [];
                        for (let l in log) {
                            items.push(log[l].message);
                        }
                        let options = { matchOnDescription: false, placeHolder: "select Commit" };

                        vscode.window.showQuickPick(items, options).then((data) => {

                            comment = historyUtil.parseLog(log[items.indexOf(data)]);

                            console.log(comment);

                            client.findIssueAndComment(issueNumber, comment, function (code, data) {
                                if (data instanceof String) {
                                    if (code === 200) {
                                        vscode.window.setStatusBarMessage(data as string);
                                    } else {
                                        this.error(data as string);
                                    }
                                } else {
                                    console.log(data);
                                }
                            });
                        });
                    }, (err) => {
                        this.error("ERROR: " + err);
                    });
                }, (err) => {
                    this.error("ERROR: " + err);
                });
            }
        });
    }

    /**
     * Get my jira issue tasks.
     * 
     * @static
     * @param {JiraClient} client 
     * @memberof Handler
     */
    public static getMyIssues (client: JiraClient): void {

        let self = this;
        client.listStatuses(function (code, data) {
            if (code === 400) {
                return self.error(data);
            } else {
                let items: QuickPickItem[] = [],
                    options = {
                        placeHolder: "select task status!",
                        matchOnDescription: true
                    },
                    statuses: any = null;

                if (data instanceof Array) {
                    statuses = data[0].statuses;
                } else {
                    statuses = data.statuses;
                }

                for (let status of statuses) {
                    let item: QuickPickItem = {
                        label: status.name,
                        description: status.description,
                    };
                    items.push(item);
                }
                vscode.window.showQuickPick(items, options).then((data) => {
                    if (data) {
                        self.getIssuesByStatus(client, data);
                    }
                });
            }
        });
    }

    /**
     * Get issues by status.
     * 
     * @private
     * @param {JiraClient} client 
     * @param {QuickPickItem} status 
     * @memberof Handler
     */
    private static getIssuesByStatus (client: JiraClient, status: QuickPickItem): void {
            client.searchJira(`assignee = ${client.username} and status = ${status.label} order by priority desc`, function (code, data) {
                if (code === 400) {
                    return console.error(data);
                }
                console.log(data);
                let items: QuickPickItem[] = [],
                    options = {
                        placeHolder: "select task!",
                        matchOnDetail: true
                    };

                for (let issue of data.issues) {
                    let item: QuickPickItem = {
                        label: issue.key,
                        description: issue.fields.status.name,
                        detail: issue.fields.summary,
                    };
                    items.push(item);
                }
                vscode.window.showQuickPick(items, options).then((data) => {
                    console.log(data);
                });
            });
        }

}