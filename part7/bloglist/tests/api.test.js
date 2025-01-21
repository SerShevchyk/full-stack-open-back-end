const { test, describe, after, beforeEach, beforeAll } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const testHelper = require('./test_helper')
const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  const saltRounds = 10
  const passwordHash = await bcrypt.hash('TestPass', saltRounds)

  const user = await User.collection.insertOne({
    'username': 'Test',
    'name': 'Test Author',
    'passwordHash': passwordHash,
    'blogs': []
  })
  this.testUserToken = await testHelper.getTestUserToken()

  await Blog.deleteMany({})

  const blogs = await testHelper.initialBlogs()
  await Blog.insertMany(blogs)
})

describe('blogs_api', () => {

  test('4.8 Blogs are returned as json and two blogs in response', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.length, 2)
  })

  test('4.9 Blogs have id', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
      .expect((res) => {
        res.body.reduce((blog) => {
          if (!('id' in blog)) throw new Error('Missing id key in response')
        })
      })

    assert.strictEqual(response.body.length, 2)
  })

  describe('Adding of a new blog', () => {

    test('4.10 A valid blog can be added', async () => {
      const blogsAtStart = await testHelper.blogsInDb()

      const newBlog = {
        'author': 'Test',
        'title': 'Full Stack open course is the best practice',
        'url': 'https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12',
        'likes': 100
      }

      await api
        .post('/api/blogs')
        .set('Authorization', this.testUserToken)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAfter = await testHelper.blogsInDb()

      const response = await api.get('/api/blogs')
      const contents = response.body.map(blog => blog.title)

      assert.strictEqual(blogsAfter.length, blogsAtStart.length + 1)
      assert(contents.includes('Full Stack open course is the best practice'))
    })

    test('4.23* A blog cant be added without token', async () => {

      const newBlog = {
        'author': 'Test',
        'title': 'Full Stack open course is the best practice',
        'url': 'https://fullstackopen.com/en/part4/testing_the_backend#exercises-4-8-4-12',
        'likes': 100
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
    })

    test('4.11* A blog without the likes property return 0 likes', async () => {
      const newBlog = {
        'author': 'Test',
        'title': 'Part 4. Full Stack open course',
        'url': 'https://fullstackopen.com/en/part4',
      }

      await api
        .post('/api/blogs')
        .set('Authorization', this.testUserToken)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
        .expect((res) => {
          if (!('likes' in res.body) || res.body.likes !== 0 ) throw new Error('Wrong value for likes property.')
        })
    })

    test('4.12* A blog require title and url', async () => {
      await api
        .post('/api/blogs')
        .set('Authorization', this.testUserToken)
        .send({
          'author': 'Test',
          'title': 'Part 4. Full Stack open course',
          'likes': 0
        })
        .expect(400)

      await api
        .post('/api/blogs')
        .set('Authorization', this.testUserToken)
        .send({
          'author': 'Test',
          'url': 'https://fullstackopen.com/en/part4',
          'likes': 0
        })
        .expect(400)
    })
  })

  describe('Removing a blog', () => {

    test('4.13 Remove blog and get status 204', async () => {
      const blogsAtStart = await testHelper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', this.testUserToken)
        .expect(204)

      const blogsAtEnd = await testHelper.blogsInDb()

      const contents = blogsAtEnd.map(r => r.title)
      assert(!contents.includes(blogToDelete.title))

      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
    })
  })

  describe('Updating a blog', () => {
    test('4.14 Update the blog likes', async () => {
      const blogsAtStart = await testHelper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send({ ...blogToUpdate, likes: blogToUpdate.likes + 10 })
        .expect(201)

      const blogs = await testHelper.blogsInDb()

      const updatedBlog = blogs.find(blog => blog.id === blogToUpdate.id)

      assert.strictEqual(updatedBlog.likes, blogToUpdate.likes + 10)
    })
  })
})

describe('users_api', () => {

  test('4.16* Creating user with wrong user name or password', async () => {
    let result = await api
      .post('/api/users')
      .send({
        'username': 'TestUsername',
        'name': 'Test',
        'password': 'T'
      })
      .expect(400)

    assert(result.body.error.includes('Password must be at least 3 characters long.'))

    result = await api
      .post('/api/users')
      .send({
        'username': 'T',
        'name': 'Test',
        'password': 'TestPassword'
      })
      .expect(400)

    assert(result.body.error.includes('User validation failed: username:'))
  })
})

after(async () => {
  await mongoose.connection.close()
})