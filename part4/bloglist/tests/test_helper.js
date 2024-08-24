const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = async () => {
  const users = await usersInDb()

  const blogs = [
    {
      'title': 'Full Stack Open',
      'author': 'Serhii Shevchyk',
      'url': 'https://fullstackopen.com',
      'likes': 5,
      'user': users[0].id
    },
    {
      'title': 'Drupal',
      'author': 'Anna',
      'url': 'https://drupal.org',
      'likes': 10,
      'user': users[0].id
    }
  ]

  return blogs
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

const getTestUserToken = async () => {
  const users = await usersInDb()

  const userForToken = {
    username: users[0].username,
    id: users[0].id,
  }

  let token = jwt.sign(userForToken, 'TESTSECRET')

  return `Bearer ${token}`
}

module.exports = {
  initialBlogs,
  blogsInDb,
  getTestUserToken,
  usersInDb
}