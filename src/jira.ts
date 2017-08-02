"use strict";
let JiraApi = require("jira-client");
/**
 * JIRA client api proxy
 * 
 * @class JiraClient
 */
export class JiraClient {

    /**
     * Jira api client
     * 
     * @private
     * @type {*}
     * @memberof JiraClient
     */
    private client: any;

    /**
     * JIRA server host
     * 
     * @private
     * @type {String}
     * @memberof JiraClient
     */
    public server: String;

    /**
     * current login user.
     * 
     * @type {string}
     * @memberof JiraClient
     */
    public username: string;

    /**
     * Connected the jira server.
     * 
     * @private
     * @type {boolean}
     * @memberof JiraClient
     */
    private connecting: boolean = false;

    /**
     * Jira config object.
     * 
     * @private
     * @type {Object}
     * @memberof JiraClient
     */
    private config: Object = null;

    constructor (config: Object) {
        this.client = new JiraApi(config);
        this.server = this.client.host;
        this.connecting = true;
        this.config = config;
        this.username = config["username"];
    }

    isConnection (): boolean {
        return this.connecting;
    }
    /**
     * Add issue comment by issue key or issue id
     * 
     * @param {string} issueNumber 
     * @param {string} comment 
     * @param {(code: number, data: String | any) => void} callback 
     * @memberof JiraClient
     */
    findIssueAndComment (issueNumber: string, comment: string, callback: (code: number, data: string | any) => void): void {
        this.client.findIssue(issueNumber).then((issue) => {
            this.client.addComment(issueNumber, comment).then((ret) => {
                callback(200, ret);
            }).catch((err) => {
                callback(400, `ERROR: comment Issue ${issueNumber}: ${err}`);
            });
        }).catch((err) => {
            callback(400, `ERROR: Issue ${issueNumber} not found!`);
        });
    }

    /**
     * JIRA search api.
     * 
     * @param {string} jql 
     * @param {((code: number, data: string | any) => void)} callback 
     * @memberof JiraClient
     */
    searchJira (jql: string, callback: (code: number, data: string | any) => void): void {
        this.client.searchJira(jql).then((data) => {
            callback(200, data);
        }, (err) => {
            callback(400, err);
        }).catch((err) => {
            callback(400, err);
        });
    }

    /**
     * Get status for project.
     * 
     * @param {((code: number, data: string | any) => void)} callback 
     * @param {string} [project] 
     * @memberof JiraClient
     */
    listStatuses (callback: (code: number, data: string | any) => void, project?: string): void {
        if (!project) {
            project = this.config["defaultProject"];
        }
        if (!project) {
            callback(400, "No project found can not get statuses!");
        }

        this.makeUri({
            pathname: `/project/${project}/statuses`
        }).then(data => {
            callback(200, data);
        }, err => {
            callback(400, err);
        });

    }

    /**
     * Make uri with the jiri api not support interface.
     * 
     * @private
     * @param {{pathname: string, query?: any}} query 
     * @param {{method: string, items: any[]}} [body] 
     * @returns {*} 
     * @memberof JiraClient
     */
    private makeUri (query: {pathname: string, query?: any}, body?: {method: string, items: any[]}): any {
        return this.client.doRequest(
            this.client.makeRequestHeader(
                this.client.makeUri(query),
                body
            )
        );
    }

}
