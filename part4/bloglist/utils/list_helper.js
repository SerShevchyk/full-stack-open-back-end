var lodash = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((a, blog) => {
    return a + blog.likes
  }, 0)
}

const favoriteBlog = (blogs) => {
  const likes = blogs.reduce((a, blog) => {
    return a > blog.likes ? a : blog.likes
  }, 0)

  const blog = blogs.find(blog => blog.likes === likes)

  delete blog._id
  delete blog.__v
  delete blog.url

  return blog
}

const mostBlogs = (blogs) => {
  const stats = lodash.countBy(blogs, 'author')
  const statsArray = []

  for (const [author, value] of Object.entries(stats)) {
    statsArray.push({ 'author': author, 'blogs': value })
  }

  return statsArray.reduce((prev, next) => {
    return prev.blogs > next.blogs ? prev : next
  })
}

const mostLikes = (blogs) => {
  const stats = lodash.groupBy(blogs, 'author')
  const statsArray = []

  for (const [author, values] of Object.entries(stats)) {
    let likes = values.reduce((a, v) => a + v.likes, 0)
    statsArray.push({ 'author': author, 'likes': likes })
  }

  return statsArray.reduce((prev, next) => {
    return prev.likes > next.likes ? prev : next
  })
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}