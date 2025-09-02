const autocannon = require('autocannon');
const { promisify } = require('util');
const autocannonAsync = promisify(autocannon);

async function runLoadTests() {
  console.log('Starting performance tests...');

  console.log('\n1. Testing basic directory listing...');
  const basicResult = await autocannonAsync({
    url: 'http://localhost:3000',
    connections: 10,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/api/directoryListing/directory?path=/tmp&page=1&pageSize=100'
      }
    ]
  });

  console.log('Basic test results:');
  console.log(`- Requests/sec: ${basicResult.requests.average}`);
  console.log(`- Latency (avg): ${basicResult.latency.average}ms`);
  console.log(`- Throughput: ${basicResult.throughput.average}KB/s`);

  console.log('\n2. Testing large directory simulation...');
  const largeDirResult = await autocannonAsync({
    url: 'http://localhost:3000',
    connections: 5,
    duration: 60,
    requests: [
      {
        method: 'GET',
        path: '/api/directoryListing/directory?path=/large-dir&page=1&pageSize=1000'
      }
    ]
  });

  console.log('Large directory test results:');
  console.log(`- Requests/sec: ${largeDirResult.requests.average}`);
  console.log(`- Latency (avg): ${largeDirResult.latency.average}ms`);
  console.log(`- Throughput: ${largeDirResult.throughput.average}KB/s`);

  console.log('\n3. Testing concurrent access...');
  const concurrentResult = await autocannonAsync({
    url: 'http://localhost:3000',
    connections: 20,
    duration: 45,
    requests: [
      {
        method: 'GET',
        path: '/api/directoryListing/directory?path=/tmp&page=1&pageSize=50'
      }
    ]
  });

  console.log('Concurrent test results:');
  console.log(`- Requests/sec: ${concurrentResult.requests.average}`);
  console.log(`- Latency (avg): ${concurrentResult.latency.average}ms`);
  console.log(`- Error rate: ${((concurrentResult.errors / concurrentResult.requests.total) * 100).toFixed(2)}%`);


  console.log('\n4. Testing pagination performance...');
  const paginationResults = [];
  
  for (let page = 1; page <= 5; page++) {
    const result = await autocannonAsync({
      url: 'http://localhost:3000',
      connections: 3,
      duration: 15,
      requests: [
        {
          method: 'GET',
          path: `/api/directoryListing/directory?path=/large-dir&page=${page}&pageSize=500`
        }
      ]
    });

    paginationResults.push(result);
    console.log(`Page ${page}: ${result.latency.average}ms latency`);
  }

  console.log('\nPerformance tests completed!');
}

runLoadTests().catch(console.error);