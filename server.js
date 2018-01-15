const http = require('http')
const ArticlesController = require('./src/server/ArticlesController')
const CommentsController = require('./src/server/CommentsController')

// database is let instead of const to allow us to modify it in test.js
// This is also placed at top to close the variable inside of other methods
let database = {
  users: {},
  articles: {},
  nextArticleId: 1,
  comments: {},
  nextCommentId: 1
}

let articlesController = new ArticlesController(database)
let commentsController = new CommentsController(database)

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': articlesController.getArticles,
    'POST': articlesController.createArticle
  },
  '/articles/:id': {
    'GET': articlesController.getArticle,
    'PUT': articlesController.updateArticle,
    'DELETE': articlesController.deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': articlesController.upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': articlesController.downvoteArticle
  },
  '/comments': {
    'GET': commentsController.getComments,
    'POST': commentsController.createComment
  },
  '/comments/:id': {
    'GET': commentsController.getComments,
    'PUT': commentsController.updateComments,
    'DELETE': commentsController.deleteComments
  },
  '/comments/:id/upvote': {
    'PUT': commentsController.upvoteComment
  },
  '/comments/:id/downvote': {
    'PUT': commentsController.downvoteComment
  }
}

// TODO: Move Me to UserController
function getUser (url) {
  const username = url.split('/').filter(segment => segment)[1]
  const user = database.users[username]
  const response = {}

  if (user) {
    const userArticles = user.articleIds.map(
      articleId => database.articles[articleId])
    const userComments = user.commentIds.map(
      commentId => database.comments[commentId])
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    }
    response.status = 200
  } else if (username) {
    response.status = 404
  } else {
    response.status = 400
  }

  return response
}

// TODO: Move Me to UserController
function getOrCreateUser (url, request) {
  const username = request.body && request.body.username
  const response = {}

  if (database.users[username]) {
    response.body = {user: database.users[username]}
    response.status = 200
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    }
    database.users[username] = user

    response.body = {user: user}
    response.status = 201
  } else {
    response.status = 400
  }

  return response
}

const port = process.env.PORT || 4000
const isTestMode = process.env.IS_TEST_MODE

const requestHandler = (request, response) => {
  const url = request.url
  const method = request.method
  const route = getRequestRoute(url)

  if (method === 'OPTIONS') {
    var headers = {}
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE, OPTIONS'
    headers['Access-Control-Allow-Credentials'] = false
    headers['Access-Control-Max-Age'] = '86400' // 24 hours
    headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
    response.writeHead(200, headers)
    return response.end()
  }

  response.setHeader('Access-Control-Allow-Origin', null)
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.setHeader(
    'Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 404
    response.write('Route Not Found!')
    return response.end()
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url)
    if (!isTestMode && (typeof saveDatabase === 'function')) {
      saveDatabase()
    }

    response.statusCode = methodResponse.status
    response.end(JSON.stringify(methodResponse.body) || '')
  } else {
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString())
      const jsonRequest = {body: body}
      const methodResponse = routes[route][method].call(null, url, jsonRequest)
      if (!isTestMode && (typeof saveDatabase === 'function')) {
        saveDatabase()
      }

      response.statusCode = methodResponse.status
      response.end(JSON.stringify(methodResponse.body) || '')
    })
  }
}

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment)

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`
  } else {
    return `/${pathSegments[0]}/:id`
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase()
  if (savedDatabase) {
    for (let key in database) {
      database[key] = savedDatabase[key] || database[key]
    }
  }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err)
  }

  console.log(`Server is listening on ${port}`)
})
