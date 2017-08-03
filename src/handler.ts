"use strict";

import * as vscode from "vscode";
import * as historyUtil from "./historyUtils";

import { JiraClient } from "./jira";
import { InputBoxOptions, QuickPickItem, QuickPickOptions } from "vscode";

/**
 * vscode util class.
 * 
 * @export
 * @class Handler
 */
export class Handler {

    /**
     * JIRA client instance.
     * 
     * @private
     * @static
     * @type {JiraClient}
     * @memberof Handler
     */
    private static client: JiraClient = null;

    /**
     * Set a jira client.
     * 
     * @static
     * @param {JiraClient} client 
     * @memberof Handler
     */
    public static setClient(client: JiraClient): void {
        this.client = client;
    }

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
    public static addCommentForIssue (): void {
        let self = this;
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

                            self.client.findIssueAndComment(issueNumber, comment, function (code, data) {
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
     * @param {(item: QuickPickItem) => void} [callback] 
     * @memberof Handler
     */
    public static getMyIssues (callback?: (item: QuickPickItem) => void): void {

        let self = this;
        this.client.listStatuses(function (code, data) {
            if (code === 400) {
                return self.error(data);
            } else {
                let items: QuickPickItem[] = [],
                    options: QuickPickOptions = {
                        placeHolder: "select task status!",
                        matchOnDescription: true
                    },
                    statuses: any = null;

                if (data instanceof Array) {
                    statuses = data[0].statuses;
                } else {
                    statuses = data.statuses;
                }

                items.push({
                    label: 'All',
                    description: 'All issue statuses'
                });
                for (let status of statuses) {
                    let item: QuickPickItem = {
                        label: status.name,
                        description: status.description,
                    };
                    items.push(item);
                }
                vscode.window.showQuickPick(items, options).then((data) => {
                    if (data) {
                        self.getIssuesByStatus(data, callback);
                    }
                });
            }
        });
    }

    /**
     * Get issues by status.
     * 
     * @private
     * @static
     * @param {QuickPickItem} status 
     * @param {(item: QuickPickItem) => void} [callback] 
     * @memberof Handler
     */
    private static getIssuesByStatus (status: QuickPickItem, callback?: (item: QuickPickItem) => void): void {
        let other = status.label !== 'All' ? `and status = ${status.label}`: '',
            url = `assignee = ${this.client.username} ${other} order by priority desc`;

        this.client.searchJira(url, function (code, data) {
            if (code === 400) {
                return console.error(data);
            }
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
                callback(data);
            });
        });
    }

    /**
     * Do my issure.
     * 
     * @static
     * @memberof Handler
     */
    public static doMyIssue(): void {
        let self = this;
        this.getMyIssues(function (item) {
            if (!item) return;

            self.client.transitions(item.label, function (code, data) {
                if (code === 200) {
                    let items: QuickPickItem[] = [],
                        options = {
                            placeHolder: "select one transition!",
                            matchOnDetail: true
                        };

                    for (let trans of data.transitions) {
                        let item: QuickPickItem = {
                            label: trans.id,
                            description: trans.name
                        };
                        items.push(item);
                    }
                    vscode.window.showQuickPick(items, options).then((data) => {
                        if (data) {
                            self.doIssueTransition(item.label, data);
                        }
                    });
                } else {
                    self.error(data);
                }
            });
        });
    }

    /**
     * Handle issue with a transtion
     * 
     * @private
     * @static
     * @param {string} issueKey 
     * @param {QuickPickItem} item 
     * @memberof Handler
     */
    private static doIssueTransition (issueKey: string, item: QuickPickItem): void {
        this.client.doTransition(issueKey, item.label, function (code, data) {
            if (code !== 200) {
                vscode.window.setStatusBarMessage(`Transition failured. ${data}`);
            } else {
                vscode.window.setStatusBarMessage('Transition successed.', 2000);
            }
        });
    }

}