require('dotenv').config()
const { dbConnect, col } = require('./db')

let count = 0

const findPersonProperties = () => col('persons')
  .aggregate([
    { $project: { properties: 1 } },
    { $match: { 'properties.type': 'A influencé' } },
    { $unwind: '$properties' },
    { $match: { 'properties.type': 'A influencé' } },
    { $project: { _id: 1, href: '$properties.href', propertyId: '$properties._id' } },
  ])

const definePersonId = async property => {
  const documentId = property._id
  const propertyId = property.propertyId
  const personId = await searchPersonIdFromUrl(property.href)
  await updateProperty(documentId, propertyId, personId || 'not found')
  console.log(count++, documentId, propertyId, personId)
}

const searchPersonIdFromUrl = async url => {
  const person = await col('persons')
    .findOne(
      { url: new RegExp(`.*${url}`) },
      { _id: 1 },
    )
  return person && person._id
}

const updateProperty = (_id, propertyId, personId) =>
  col('persons')
    .updateOne(
      { _id, 'properties._id': propertyId },
      { $set: { 'properties.$.personId': personId } },
    )

dbConnect()
  .then(findPersonProperties)
  .then(properties => properties.forEach(definePersonId))
  .then(() => console.log('END'))
  .catch(e => console.error(e))