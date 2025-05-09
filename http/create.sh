curl -X 'POST' \
  'http://localhost:3000/widgets' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "id": "1",
  "weight": 1,
  "color": "green"
}' --verbose