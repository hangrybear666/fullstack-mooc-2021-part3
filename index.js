const express = require('express')

/**
 * express library for rest call handling
 */
const app = express()

/**
 * json parser
 */
app.use(express.json())

let persons = [
    {
      "name": "Arto Hellas",
      "number": "040-123456",
      "id": 1
    },
    {
      "name": "Ada Lovelace",
      "number": "39-44-5323523",
      "id": 2
    },
    {
      "name": "Dan Abramov",
      "number": "12-43-234345",
      "id": 3
    },
    {
      "name": "Mary Poppendieck",
      "number": "39-23-6423122",
      "id": 4
    }
  ]

/**
 * http GET request to ROOT of URL
 * responds with html page
 */
app.get('/', (request, response) => {
  console.log(`GET server root queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  response.send('<h1>Hello World!</h1>')
})

/**
 * http GET request to /api/persons of URL
 * responds with json file containing all notes
 */
app.get('/api/persons', (request, response) => {
  console.log(`GET full list of persons queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  response.json(persons)
})

/**
 * http GET request to /api/persons/id of URL
 * responds with json file containing exactly one note
 */
app.get('/api/persons/:id', (request, response) => {
  console.log(`GET person with id ${request.params.id} queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if (person) {
    response.json(person)
  } else {
    const errorMsg = `<h4 style="color:red">person with id ${id} not found</h4>`
    response.status(404).send(errorMsg).end()
  }
})

/**
 * http DELETE request to /api/persons/id of URL
 * responds with nothing, or an error
 */
app.delete('/api/persons/:id', (request, response) => {
  console.log(`DELETE person with id ${request.params.id} queried by ${request.rawHeaders[0]} : ${request.rawHeaders[1]}`)
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if(person) {
    persons = persons.filter(person => person.id !== id )
  } else {
    response.statusMessage = `Person with id ${id} not found.`
    response.status(204).end()
  }
})

app.post('/api/persons', (request, response) => {
  console.log("post request")
  const person = request.body
  console.log(person)
})

/**
 * Listener keeping the server alive
 */
const PORT = 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})