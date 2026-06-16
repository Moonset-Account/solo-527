const { ObjectId } = require('mongodb');

const store = {};

const initCollection = (name, seedData = []) => {
  if (!store[name]) {
    store[name] = seedData.map(item => ({
      ...item,
      _id: item._id || new ObjectId().toString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
  }
  return store[name];
};

const matchQuery = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const [key, value] of Object.entries(query)) {
    if (key === '$text') continue;
    if (key === '$or') {
      const matched = value.some(cond => matchQuery(doc, cond));
      if (!matched) return false;
      continue;
    }
    if (key === '$and') {
      const allMatched = value.every(cond => matchQuery(doc, cond));
      if (!allMatched) return false;
      continue;
    }
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$gte' in value) {
        const docVal = doc[key] instanceof Date ? doc[key] : new Date(doc[key]);
        const qVal = value.$gte instanceof Date ? value.$gte : new Date(value.$gte);
        if (docVal < qVal) return false;
      }
      if ('$lte' in value) {
        const docVal = doc[key] instanceof Date ? doc[key] : new Date(doc[key]);
        const qVal = value.$lte instanceof Date ? value.$lte : new Date(value.$lte);
        if (docVal > qVal) return false;
      }
      if ('$in' in value) {
        if (!value.$in.includes(doc[key])) return false;
      }
      if ('$eq' in value) {
        if (doc[key] != value.$eq) return false;
      }
    } else if (Array.isArray(value)) {
      if (!Array.isArray(doc[key]) || doc[key].length !== value.length) return false;
      for (let i = 0; i < value.length; i++) {
        if (doc[key][i] !== value[i]) return false;
      }
    } else {
      if (doc[key] != value) return false;
    }
  }
  return true;
};

const getRefCollection = (path) => {
  const refMap = {
    trainerId: 'users',
    createdBy: 'users',
    updatedBy: 'users',
    reviewerId: 'users',
    visitorId: 'users',
    petId: 'pets',
    applicationId: 'adoptionApplications',
    operatorId: 'users',
  };
  return refMap[path] || null;
};

class MemoryQuery {
  constructor(collection, query = {}) {
    this.collection = collection;
    this.query = query;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populate = [];
    this._select = null;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  populate(path, select = null) {
    if (Array.isArray(path)) {
      this._populate.push(...path.map(p => typeof p === 'string' ? { path: p } : p));
    } else if (typeof path === 'string') {
      this._populate.push({ path, select });
    } else if (path && path.path) {
      this._populate.push(path);
    }
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  _applyPopulate(docs) {
    return docs.map(doc => {
      const result = { ...doc };
      for (const p of this._populate) {
        const path = p.path;
        const refId = result[path];
        if (refId) {
          const refCollection = getRefCollection(path);
          if (refCollection && store[refCollection]) {
            const refDoc = store[refCollection].find(d => 
              d._id === refId || d._id?.toString() === refId || d._id == refId
            );
            if (refDoc) {
              let populated = { ...refDoc };
              if (refCollection === 'users') {
                delete populated.password;
              }
              if (p.select) {
                const { include, exclude } = this._parseSelect(p.select);
                if (include.length > 0) {
                  const selected = { _id: populated._id };
                  for (const field of include) {
                    if (field in populated) selected[field] = populated[field];
                  }
                  populated = selected;
                }
                if (exclude.length > 0) {
                  for (const field of exclude) {
                    delete populated[field];
                  }
                }
              }
              result[path] = populated;
            }
          }
        }
      }
      return result;
    });
  }

  _applySelect(docs) {
    if (!this._select) return docs;
    
    const { include, exclude } = this._parseSelect(this._select);
    
    if (include.length > 0) {
      return docs.map(doc => {
        const result = { _id: doc._id };
        for (const field of include) {
          if (field in doc) {
            result[field] = doc[field];
          }
        }
        return result;
      });
    }
    
    if (exclude.length > 0) {
      return docs.map(doc => {
        const result = { ...doc };
        for (const field of exclude) {
          delete result[field];
        }
        return result;
      });
    }
    
    return docs;
  }

  _parseSelect(select) {
    let include = [];
    let exclude = [];
    
    if (typeof select === 'string') {
      const fields = select.split(' ').filter(f => f);
      for (const field of fields) {
        if (field.startsWith('-')) {
          exclude.push(field.substring(1));
        } else {
          include.push(field);
        }
      }
    } else if (typeof select === 'object') {
      for (const [key, value] of Object.entries(select)) {
        if (value === 0 || value === false) {
          exclude.push(key);
        } else {
          include.push(key);
        }
      }
    }
    
    return { include, exclude };
  }

  async exec() {
    let results = this.collection.filter(doc => matchQuery(doc, this.query));
    
    if (this._sort) {
      const [[sortField, sortOrder]] = Object.entries(this._sort);
      results.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });
    }
    
    if (this._skip) {
      results = results.slice(this._skip);
    }
    
    if (this._limit) {
      results = results.slice(0, this._limit);
    }
    
    results = this._applyPopulate(results);
    results = this._applySelect(results);
    
    return results;
  }

  then(resolve, reject) {
    this.exec().then(resolve).catch(reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

class MemoryFindById {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
    this._populate = [];
    this._select = null;
    this.doc = null;
  }

  populate(path, select = null) {
    if (typeof path === 'string') {
      this._populate.push({ path, select });
    } else if (path && path.path) {
      this._populate.push(path);
    }
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  _findDoc() {
    if (this.doc) return this.doc;
    this.doc = this.collection.find(d => 
      d._id === this.id || d._id?.toString() === this.id || d._id == this.id
    );
    return this.doc;
  }

  async exec() {
    let doc = this._findDoc();
    if (!doc) return null;
    
    let result = { ...doc };
    
    for (const p of this._populate) {
      const path = p.path;
      const refId = result[path];
      if (refId) {
        const refCollection = getRefCollection(path);
        if (refCollection && store[refCollection]) {
          const refDoc = store[refCollection].find(d => 
            d._id === refId || d._id?.toString() === refId || d._id == refId
          );
          if (refDoc) {
            let populated = { ...refDoc };
            if (refCollection === 'users') {
              delete populated.password;
            }
            result[path] = populated;
          }
        }
      }
    }
    
    if (this._select) {
      const { include, exclude } = this._parseSelect(this._select);
      
      if (include.length > 0) {
        const selected = { _id: result._id };
        for (const field of include) {
          if (field in result) selected[field] = result[field];
        }
        result = selected;
      }
      
      if (exclude.length > 0) {
        for (const field of exclude) {
          delete result[field];
        }
      }
    }
    
    return result;
  }

  _parseSelect(select) {
    let include = [];
    let exclude = [];
    
    if (typeof select === 'string') {
      const fields = select.split(' ').filter(f => f);
      for (const field of fields) {
        if (field.startsWith('-')) {
          exclude.push(field.substring(1));
        } else {
          include.push(field);
        }
      }
    } else if (typeof select === 'object') {
      for (const [key, value] of Object.entries(select)) {
        if (value === 0 || value === false) {
          exclude.push(key);
        } else {
          include.push(key);
        }
      }
    }
    
    return { include, exclude };
  }

  then(resolve, reject) {
    this.exec().then(resolve).catch(reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const createMemoryModel = (name, seedData = []) => {
  const collection = initCollection(name, seedData);

  const model = {
    _collection: collection,

    find(query = {}) {
      return new MemoryQuery(collection, query);
    },

    findById(id) {
      return new MemoryFindById(collection, id);
    },

    async findOne(query = {}) {
      const doc = collection.find(d => matchQuery(d, query));
      return doc ? { ...doc } : null;
    },

    async create(data) {
      const newDoc = {
        ...data,
        _id: data._id || new ObjectId().toString(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      collection.push(newDoc);
      const result = { ...newDoc };
      result.toObject = () => ({ ...newDoc });
      result.save = async () => result;
      return result;
    },

    async findByIdAndUpdate(id, updateData, options = {}) {
      const index = collection.findIndex(d => 
        d._id === id || d._id?.toString() === id || d._id == id
      );
      if (index === -1) return null;
      
      const updateObj = { ...updateData };
      delete updateObj._id;
      delete updateObj.createdAt;
      
      collection[index] = {
        ...collection[index],
        ...updateObj,
        updatedAt: new Date().toISOString(),
        _id: collection[index]._id,
        createdAt: collection[index].createdAt,
      };
      
      const result = options.new ? { ...collection[index] } : { ...collection[index] };
      if (options.new) {
        result.toObject = () => ({ ...collection[index] });
      }
      return result;
    },

    async findOneAndUpdate(query, updateData, options = {}) {
      const index = collection.findIndex(d => matchQuery(d, query));
      if (index === -1) return null;
      
      const updateObj = { ...updateData };
      delete updateObj._id;
      delete updateObj.createdAt;
      
      collection[index] = {
        ...collection[index],
        ...updateObj,
        updatedAt: new Date().toISOString(),
        _id: collection[index]._id,
        createdAt: collection[index].createdAt,
      };
      
      const result = options.new ? { ...collection[index] } : { ...collection[index] };
      return result;
    },

    async findByIdAndDelete(id) {
      const index = collection.findIndex(d => 
        d._id === id || d._id?.toString() === id || d._id == id
      );
      if (index === -1) return null;
      const deleted = collection.splice(index, 1)[0];
      return { ...deleted };
    },

    async findOneAndDelete(query) {
      const index = collection.findIndex(d => matchQuery(d, query));
      if (index === -1) return null;
      const deleted = collection.splice(index, 1)[0];
      return { ...deleted };
    },

    async countDocuments(query = {}) {
      return collection.filter(doc => matchQuery(doc, query)).length;
    },

    async estimatedDocumentCount() {
      return collection.length;
    },

    async insertMany(docs) {
      const newDocs = docs.map(d => ({
        ...d,
        _id: d._id || new ObjectId().toString(),
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
      }));
      collection.push(...newDocs);
      return newDocs.map(d => ({ ...d }));
    },

    async exists(query) {
      const doc = collection.find(d => matchQuery(d, query));
      return doc ? { _id: doc._id } : null;
    },

    async aggregate(pipeline = []) {
      let results = [...collection];
      
      for (const stage of pipeline) {
        if (stage.$match) {
          results = results.filter(doc => matchQuery(doc, stage.$match));
        } else if (stage.$group) {
          const groups = {};
          const groupKeys = {};
          
          for (const doc of results) {
            let groupId;
            let groupKeyData = {};
            
            if (typeof stage.$group._id === 'string' && stage.$group._id.startsWith('$')) {
              const field = stage.$group._id.substring(1);
              groupId = doc[field];
              groupKeyData[field] = doc[field];
            } else if (typeof stage.$group._id === 'object' && stage.$group._id !== null) {
              const idParts = {};
              for (const [key, val] of Object.entries(stage.$group._id)) {
                if (typeof val === 'string' && val.startsWith('$')) {
                  const field = val.substring(1);
                  if (field.startsWith('$')) {
                    const op = field.substring(1);
                    if (op === 'dateToString') {
                      const dateVal = doc[Object.keys(stage.$group._id[key]).find(k => 
                        typeof stage.$group._id[key][k] === 'string' && stage.$group._id[key][k].startsWith('$')
                      )?.substring(1)] || doc.createdAt;
                      const dateStr = new Date(dateVal).toISOString().split('T')[0];
                      idParts[key] = dateStr;
                    }
                  } else {
                    idParts[key] = doc[field];
                    groupKeyData[field] = doc[field];
                  }
                } else {
                  idParts[key] = val;
                }
              }
              groupId = JSON.stringify(idParts);
              groupKeyData = idParts;
            } else {
              groupId = stage.$group._id;
            }
            
            const groupKey = String(groupId);
            if (!groups[groupKey]) {
              groups[groupKey] = { _id: groupId, _keyData: groupKeyData };
            }
            
            const group = groups[groupKey];
            
            for (const [key, val] of Object.entries(stage.$group)) {
              if (key === '_id') continue;
              
              if (val && typeof val === 'object') {
                if ('$sum' in val) {
                  if (val.$sum === 1 || val.$sum === 1.0) {
                    group[key] = (group[key] || 0) + 1;
                  } else if (typeof val.$sum === 'string' && val.$sum.startsWith('$')) {
                    const field = val.$sum.substring(1);
                    group[key] = (group[key] || 0) + (doc[field] || 0);
                  } else if (typeof val.$sum === 'number') {
                    group[key] = (group[key] || 0) + val.$sum;
                  }
                } else if ('$first' in val) {
                  if (typeof val.$first === 'string' && val.$first.startsWith('$')) {
                    const field = val.$first.substring(1);
                    if (!(key in group)) {
                      group[key] = doc[field];
                    }
                  }
                } else if ('$last' in val) {
                  if (typeof val.$last === 'string' && val.$last.startsWith('$')) {
                    const field = val.$last.substring(1);
                    group[key] = doc[field];
                  }
                } else if ('$max' in val) {
                  if (typeof val.$max === 'string' && val.$max.startsWith('$')) {
                    const field = val.$max.substring(1);
                    if (!(key in group) || doc[field] > group[key]) {
                      group[key] = doc[field];
                    }
                  }
                } else if ('$min' in val) {
                  if (typeof val.$min === 'string' && val.$min.startsWith('$')) {
                    const field = val.$min.substring(1);
                    if (!(key in group) || doc[field] < group[key]) {
                      group[key] = doc[field];
                    }
                  }
                } else if ('$avg' in val) {
                  if (typeof val.$avg === 'string' && val.$avg.startsWith('$')) {
                    const field = val.$avg.substring(1);
                    group._sumVals = group._sumVals || {};
                    group._countVals = group._countVals || {};
                    group._sumVals[key] = (group._sumVals[key] || 0) + (doc[field] || 0);
                    group._countVals[key] = (group._countVals[key] || 0) + 1;
                    group[key] = group._sumVals[key] / group._countVals[key];
                  }
                } else if ('$push' in val) {
                  group[key] = group[key] || [];
                  if (typeof val.$push === 'string' && val.$push.startsWith('$')) {
                    const field = val.$push.substring(1);
                    group[key].push(doc[field]);
                  } else {
                    group[key].push(val.$push);
                  }
                } else if ('$addToSet' in val) {
                  group[key] = group[key] || [];
                  const pushVal = typeof val.$addToSet === 'string' && val.$addToSet.startsWith('$')
                    ? doc[val.$addToSet.substring(1)]
                    : val.$addToSet;
                  if (!group[key].includes(pushVal)) {
                    group[key].push(pushVal);
                  }
                } else if ('$cond' in val) {
                  group[key] = group[key] || 0;
                } else if ('$size' in val) {
                  group[key] = group[key] || 0;
                }
              }
            }
          }
          
          results = Object.values(groups);
          
          for (const result of results) {
            for (const [key, val] of Object.entries(stage.$group || {})) {
              if (key === '_id') continue;
              
              if (val && typeof val === 'object') {
                if ('$cond' in val) {
                  let count = 0;
                  const cond = val.$cond;
                  
                  if (Array.isArray(cond) && cond.length >= 3) {
                    const docsInGroup = collection.filter(d => {
                      if (typeof stage.$group._id === 'string' && stage.$group._id.startsWith('$')) {
                        const field = stage.$group._id.substring(1);
                        return d[field] === result._id;
                      }
                      if (result._keyData) {
                        let match = true;
                        for (const [k, v] of Object.entries(result._keyData)) {
                          if (d[k] !== v) { match = false; break; }
                        }
                        return match;
                      }
                      return true;
                    });
                    
                    count = docsInGroup.filter(d => {
                      const condition = cond[0];
                      if (condition && typeof condition === 'object' && '$eq' in condition) {
                        const [eqField, eqVal] = Object.entries(condition.$eq)[0];
                        const fieldName = eqField.startsWith('$') ? eqField.substring(1) : eqField;
                        let valToCompare = eqVal;
                        if (typeof eqVal === 'string' && eqVal.startsWith('$')) {
                          valToCompare = d[eqVal.substring(1)];
                        }
                        if (Array.isArray(eqVal)) {
                          return eqVal.includes(d[fieldName]);
                        }
                        return d[fieldName] === valToCompare || d[fieldName] == valToCompare;
                      }
                      if (condition && typeof condition === 'object' && '$in' in condition) {
                        const [inField, inArr] = Object.entries(condition.$in)[0];
                        const fieldName = inField.startsWith('$') ? inField.substring(1) : inField;
                        const arr = Array.isArray(inArr) ? inArr : [];
                        return arr.includes(d[fieldName]);
                      }
                      return false;
                    }).length;
                  }
                  
                  result[key] = count;
                }
                
                if ('$size' in val) {
                  let totalSize = 0;
                  const docsInGroup = collection.filter(d => {
                    if (typeof stage.$group._id === 'string' && stage.$group._id.startsWith('$')) {
                      const field = stage.$group._id.substring(1);
                      return d[field] === result._id;
                    }
                    if (result._keyData) {
                      let match = true;
                      for (const [k, v] of Object.entries(result._keyData)) {
                        if (d[k] !== v) { match = false; break; }
                      }
                      return match;
                    }
                    return true;
                  });
                  
                  for (const d of docsInGroup) {
                    const sizeField = typeof val.$size === 'string' && val.$size.startsWith('$') 
                      ? val.$size.substring(1) 
                      : null;
                    if (sizeField && d[sizeField] && Array.isArray(d[sizeField])) {
                      totalSize += d[sizeField].length;
                    }
                  }
                  result[key] = totalSize;
                }
                
                if ('$ifNull' in val) {
                  if (result[key] === undefined || result[key] === null) {
                    if (Array.isArray(val.$ifNull) && val.$ifNull.length >= 2) {
                      result[key] = val.$ifNull[1];
                    }
                  }
                }
              }
            }
            
            if (result.total !== undefined && result.approved !== undefined) {
              result.approvalRate = result.total > 0 
                ? Math.round((result.approved / result.total) * 100 * 100) / 100 
                : 0;
            }
            
            delete result._keyData;
            delete result._sumVals;
            delete result._countVals;
          }
          
        } else if (stage.$project) {
          results = results.map(doc => {
            const projected = { ...doc };
            const includes = [];
            const excludes = [];
            
            for (const [key, val] of Object.entries(stage.$project)) {
              if (val === 0 || val === false) {
                excludes.push(key);
              } else if (val === 1 || val === true) {
                includes.push(key);
              } else if (typeof val === 'string' && val.startsWith('$')) {
                projected[key] = doc[val.substring(1)];
                includes.push(key);
              }
            }
            
            if (excludes.length > 0) {
              for (const key of excludes) {
                delete projected[key];
              }
            }
            
            if (includes.length > 0) {
              const result = {};
              if (projected._id !== undefined) result._id = projected._id;
              for (const key of includes) {
                if (projected[key] !== undefined) {
                  result[key] = projected[key];
                }
              }
              return result;
            }
            
            return projected;
          });
        } else if (stage.$sort) {
          const [[sortField, sortOrder]] = Object.entries(stage.$sort);
          results.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;
            if (aVal < bVal) return -1 * sortOrder;
            if (aVal > bVal) return 1 * sortOrder;
            return 0;
          });
        } else if (stage.$skip) {
          results = results.slice(stage.$skip);
        } else if (stage.$limit) {
          results = results.slice(0, stage.$limit);
        } else if (stage.$lookup) {
          const { from, localField, foreignField, as } = stage.$lookup;
          const fromCollection = store[from];
          if (fromCollection) {
            results = results.map(doc => {
              const localVal = doc[localField];
              const matched = fromCollection.filter(d => 
                d[foreignField] === localVal || d[foreignField]?.toString() === localVal || d[foreignField] == localVal
              );
              return { ...doc, [as]: matched };
            });
          }
        } else if (stage.$unwind) {
          const path = stage.$unwind.path ? stage.$unwind.path : stage.$unwind;
          const fieldName = path.startsWith('$') ? path.substring(1) : path;
          const newResults = [];
          for (const doc of results) {
            const arr = doc[fieldName];
            if (Array.isArray(arr) && arr.length > 0) {
              for (const item of arr) {
                newResults.push({ ...doc, [fieldName]: item });
              }
            } else if (!stage.$unwind.preserveNullAndEmptyArrays) {
            } else {
              newResults.push(doc);
            }
          }
          results = newResults;
        } else if (stage.$addFields || stage.$set) {
          const addFields = stage.$addFields || stage.$set;
          results = results.map(doc => {
            const newDoc = { ...doc };
            for (const [key, val] of Object.entries(addFields)) {
              if (typeof val === 'string' && val.startsWith('$')) {
                newDoc[key] = doc[val.substring(1)];
              } else {
                newDoc[key] = val;
              }
            }
            return newDoc;
          });
        }
      }
      
      return results;
    },

    async distinct(field, query = {}) {
      const docs = collection.filter(doc => matchQuery(doc, query));
      const values = new Set();
      for (const doc of docs) {
        if (doc[field] !== undefined && doc[field] !== null) {
          values.add(doc[field]);
        }
      }
      return Array.from(values);
    },
  };

  return model;
};

module.exports = {
  createMemoryModel,
  store,
  initCollection,
  matchQuery,
};
