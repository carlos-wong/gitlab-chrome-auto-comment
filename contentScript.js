var config = require('./config');
var axios = require('axios');
var lodash = require('lodash');

console.log('auto comment extension loaded');

var gitlab_axios_instance = axios.create({
  baseURL: config.api_url,
  timeout: 10000,
  headers: { "PRIVATE-TOKEN": config.token}
});

window.addEventListener ("load", myMain, false);

function CreateBtn(buttonName,className,clickCallback){
    let commentBtn = document.createElement("Button");       // Create a <li> node
  commentBtn.className = className;
  var textnode = document.createTextNode(buttonName);  // Create a text node
  commentBtn.addEventListener('click', function() {
    clickCallback();
  });
  commentBtn.appendChild(textnode);
  return commentBtn;
}

function GitAssigneeUsername(issue){
  return issue && issue.assignee && issue.assignee.username;
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

function CommentIssue(note){
  let issueInfo = GetCurrentIssueInfo();
  console.log('issueInfo is:',issueInfo);
  QueryProjectIssue(issueInfo.project,issueInfo.mr,(data)=>{
    console.log(data);
    let username = GitAssigneeUsername(data);
    let authorUsername = data.author.username;
    let iid = data.iid;
    let project_id = data.project_id;
    GitlabCommentissue(project_id,iid,note+" @"+(username || authorUsername),(error)=>{console.log('comment error:',error);});
  }); 
}

function myMain () {
  let commentDiv = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions');
  let closeissueBtn = document.querySelector('#notes > div > ul > li > div > div.timeline-content.timeline-content-form > form > div.note-form-actions > button.btn-close.js-note-target-close.btn.btn-comment.btn-comment-and-close.js-action-button');
  console.log('commentDiv is:',commentDiv);
  let goodCommentBtn = CreateBtn("good",closeissueBtn.className,()=>{
    CommentIssue("#good");
  });
  let warnCommentBtn = CreateBtn("warn",closeissueBtn.className,()=>{
    CommentIssue("#warn");
  });
  commentDiv.appendChild(goodCommentBtn);
  commentDiv.appendChild(warnCommentBtn);

}

function GetCurrentIssueInfo(){
  let curURL = document.URL;
  return GitlabParseURLInfo(curURL);
}

function GitlabParseURLInfo(url){
  let projectInfo = {};
  [projectInfo.groupname,projectInfo.projectname,projectInfo.type,projectInfo.mr] =  lodash.split(lodash.split(url,"http://www.lejuhub.com/")[1],'/');
  projectInfo.project = projectInfo.groupname + '/' + projectInfo.projectname;
  return projectInfo;
}



