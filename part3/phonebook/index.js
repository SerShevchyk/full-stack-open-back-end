require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())

morgan.token('requestData', function (req, res) {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :requestData'))

let persons = []

app.get('/', (request, response) => {
  response.send('<h1>Phonebook</h1>')
})

app.get('/info', (request, response) => {
  let currentdate = new Date()

  Person.find({}).then(persons => {
    let personsCount = persons.length

    response.send(`<div>Phonebook has info for ${personsCount} peoples</div><div>Request time: ${currentdate}</div>`)
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    // mongoose.connection.close()
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(person => {
      response.status(204).json({ error: `${person.name} was removed` }).end()
    })
    .catch(error => {
      next(error)
    })
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (!body.name) {
    return res.status(400).json({ error: 'The name is required' })
  }
  else {
    let duplicate = persons.find((p) => p.name === body.name)
    if (duplicate) {
      return res.status(400).json({ error: 'The name must be unique' })
    }
  }

  if (!body.number) {
    return res.status(400).json({ error: 'The number is required' })
  }

  // const person = new Person({...body, id: Math.floor(Math.random() * 10000000)})
  const person = new Person({ ...body })

  person
    .save()
    .then(p => {
      console.log(`Added ${p.name} number ${p.number} to phonebook`)
      res.json(p)
      // mongoose.connection.close()
    })
    .catch(e => next(e))
})

app.put('/api/persons/:id', (request, response, next) => {
  const person = request.body

  Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted ID' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})