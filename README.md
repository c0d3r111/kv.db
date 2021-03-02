# kv.db
A simple node.js embedded key value database. Values can only be JS Objects.

# Usage
Review db.js for a deeper understanding on how to use. It's only 100 lines of code.

```javascript

import Database from './db.js';

(async () => {

  // Create a new database. Root directory required, maxDirs = 1e4
  // maxDirs is in place to keep files per directory manageable
  
  const db = new Database({
    root    : '/path/to/database/directory',
    maxDirs : 1e4
  });
  
  // Ensure directory exists, create if not
  await db.open();
  
  // Save data
  const example = {
    id: 12345,
    username: 'test',
    posts: 54,
    tags: ['green', 'red', 'blue']
  };
  
  await db.set(example.id, example);
  
  // Link another property to same file
 
  await db.link(example.username, example.id);
  
  // Get data
  // exampleCopy should be identical to example
  
  const exampleCopy = await db.get(example.username);
  
  // Delete data
  
  await db.del(example.id);
  
  // example.username entry still exists however since it's a hard link
  
  // Iterate database
  // Bind objects to this method for more complex manipulations
    
  await db.each(async function(data, key, bucket) {
    void console.log({data, key, bucket)}
  });
  
  // Clear database (delete everything)
  
  await db.clear();
  
  // Update an entry
  // Objects will be merged via Object.assign
  
  await db.update(example.id, {
    posts: 65,
    tags: ['red']
  });
 
})();

```
