
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response, next) => {
  const blogs = await Blog.find({}).populate('user', { 'username': 1, 'name': 1 })
  response.json(blogs)
})

blogsRouter.post('/', middleware.tokenExtractor, middleware.userExtractor, async (request, response, next) => {
  try {
    const author = request.user
    console.log('15', author, '15')

    const blog = new Blog(request.body)
    blog.user = author

    const result = await blog.save()

    console.log('22', result, '22')
    author.blogs = author.blogs.concat(result._id)
    await author.save()

    response.status(201).json(result)
  } catch(e) {
    next(e)
  }
})

blogsRouter.delete('/:id', middleware.tokenExtractor, middleware.userExtractor, async (request, response, next) => {
  try {
    const id = request.params.id
    const blog = await Blog.findById(id)

    if (blog.user.toString() === request.user.id) {
      const result = await Blog.findByIdAndDelete(id)
      response.status(204).json(result)
    } else {
      const e = new Error()
      e.name = 'JsonWebTokenError'
      return next(e)
    }
  } catch(e) {
    next(e)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  try {
    const result = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true }).populate('user', { 'username': 1, 'name': 1, 'id': 1 })

    response.status(201).json(result)
  } catch(error) {
    next(error)
  }

})

module.exports = blogsRouter