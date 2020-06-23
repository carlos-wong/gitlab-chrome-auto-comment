var axios = require('axios');
var config = require('./config');
var lodash = require('lodash');
var gitlab_axios_instance;

function UpdateInstance(token){
  gitlab_axios_instance = axios.create({
    baseURL: config.api_url,
    timeout: 10000,
    headers: { "PRIVATE-TOKEN": token}
  });
}

function AssigneeIssue(project_path,issue_id,assignee_id,callback){
  gitlab_axios_instance
    .put("/projects/"+encodeURIComponent(project_path)+"/issues/"+issue_id,{
      assignee_ids:assignee_id
    })
    .then(data=>{
      callback();
    })
    .catch((error)=>{
      callback(error);
    })
}

function QueryProjectMr(project,iid,callback){
  gitlab_axios_instance
    .get(
      "/projects/" +
        encodeURIComponent(project) +
        "/merge_requests/"+iid
    )
    .then(data => {
      callback(data.data);
    })
    .catch((err)=>{
      callback(err,null);
    });
}

function GitlabCommentMr(project_id,iid,comment,callback){
  gitlab_axios_instance
    .post("/projects/"+encodeURIComponent(project_id)+"/merge_requests/"+iid+"/notes",{
      body:comment
    })
    .then(()=>{
      callback();
    })
    .catch((error)=>{
      callback(error);
    });
}

function GitlabCommentissue(project_id,iid,comment,callback){
  gitlab_axios_instance
    .post("/projects/"+encodeURIComponent(project_id)+"/issues/"+iid+"/notes",{
      body:comment
    })
    .then(()=>{
      callback();
    })
    .catch((error)=>{
      callback(error);
    });
}

function GitlabParseURLInfo(url){
  let projectInfo = {};
  [projectInfo.groupname,projectInfo.projectname,projectInfo.splitbar,projectInfo.type,projectInfo.mr] =  lodash.split(lodash.split(url,"https://www.lejuhub.com/")[1],'/');
  projectInfo.project = projectInfo.groupname + '/' + projectInfo.projectname;
  projectInfo.mr = parseInt(projectInfo.mr);
  return projectInfo;
}

function GetCurrentIssueInfo(){
  let curURL = document.URL;
  return GitlabParseURLInfo(curURL);
}

function QueryProjectIssue(project,iid,callback){
  gitlab_axios_instance
    .get(
      "/projects/" +
        encodeURIComponent(project) +
        "/issues/"+iid
    )
    .then(data => {
      callback(data.data);
    })
    .catch((err)=>{
      callback(err,null);
    });
}

function GitAssigneeUsername(issue){
  return issue && issue.assignee && issue.assignee.username;
}

function CommentCmd(data,note){
    let username = GitAssigneeUsername(data);
    let authorUsername = data.author.username;
    let iid = data.iid;
    let project_id = data.project_id;
    if (authorUsername !== "carlos") {
      username = authorUsername;
    }
    GitlabCommentissue(project_id,iid,note+" @"+(username || authorUsername)+ " @softdev-global",(error)=>{console.log('comment error:',error);});
}

let api={};

api.QueryProjectMr = QueryProjectMr;
api.GitlabCommentMr= GitlabCommentMr;
api.GitlabCommentissue = GitlabCommentissue;
api.GitlabParseURLInfo = GitlabParseURLInfo;
api.GetCurrentIssueInfo = GetCurrentIssueInfo;
api.QueryProjectIssue = QueryProjectIssue;
api.UpdateInstance = UpdateInstance;
api.AssigneeIssue = AssigneeIssue;
api.CommentCmd = CommentCmd;

module.exports = api;
