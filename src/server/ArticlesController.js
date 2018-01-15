const BaseController = require('./BaseController')
const upvote = require('./upvote')
const downvote = require('./downvote')

let Controller = function (database) {
  this.database = database
}

Controller.prototype.getArticles = function (url, request) {
  return BaseController.getCollectionByKey('articles', url, request, this.database)
}

Controller.prototype.createArticle = function (url, request) {
  if (!BaseController.isUserAuthenticated(request, this.database.users)) {
    return {
      body: {'errorMessage': 'User is Not Authenticated / Logged In'},
      status: 401
    }
  }

  if (!BaseController.hasValidEntity(request.body, ['article']) &&
    !BaseController.hasValidEntity(request.body.article, ['title', 'url'])) {
    return {
      body: {'errorMessage': 'One of the expected keys does not exist on the request body'},
      status: 400
    }
  }

  const requestArticle = request.body
  // Construct the entity
  const article = {
    id: this.database.nextArticleId++,
    title: requestArticle.title,
    url: requestArticle.url,
    username: requestArticle.username,
    commentIds: [],
    upvotedBy: [],
    downvotedBy: []
  }

  // Saving the Entity
  this.database.articles[article.id] = article
  this.database.users[article.username].articleIds.push(article.id)

  return {
    body: {article: article},
    status: 201
  }
}

Controller.prototype.getArticle = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const article = this.database.articles[id]
  const response = {}

  if (article) {
    article.comments = article.commentIds.map(
      commentId => this.database.comments[commentId])

    response.body = {article: article}
    response.status = 200
  } else if (id) {
    response.status = 404
  } else {
    response.status = 400
  }

  return response
}

Controller.prototype.updateArticle = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const savedArticle = this.database.articles[id]
  const requestArticle = request.body && request.body.article
  const response = {}

  if (!id || !requestArticle) {
    response.status = 400
  } else if (!savedArticle) {
    response.status = 404
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title
    savedArticle.url = requestArticle.url || savedArticle.url

    response.body = {article: savedArticle}
    response.status = 200
  }

  return response
}

Controller.prototype.deleteArticle = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const savedArticle = this.database.articles[id]
  const response = {}

  if (savedArticle) {
    this.database.articles[id] = null
    savedArticle.commentIds.forEach(commentId => {
      const comment = this.database.comments[commentId]
      this.database.comments[commentId] = null
      const userCommentIds = this.database.users[comment.username].commentIds
      userCommentIds.splice(userCommentIds.indexOf(id), 1)
    })
    const userArticleIds = this.database.users[savedArticle.username].articleIds
    userArticleIds.splice(userArticleIds.indexOf(id), 1)
    response.status = 204
  } else {
    response.status = 400
  }

  return response
}

Controller.prototype.upvoteArticle = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const username = request.body && request.body.username
  let savedArticle = this.database.articles[id]
  const response = {}

  if (savedArticle && this.database.users[username]) {
    savedArticle = upvote(savedArticle, username)

    response.body = {article: savedArticle}
    response.status = 200
  } else {
    response.status = 400
  }

  return response
}

Controller.prototype.downvoteArticle = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const username = request.body && request.body.username
  let savedArticle = this.database.articles[id]
  const response = {}

  if (savedArticle && this.database.users[username]) {
    savedArticle = downvote(savedArticle, username)

    response.body = {article: savedArticle}
    response.status = 200
  } else {
    response.status = 400
  }

  return response
}

module.exports = Controller
