curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyB905dKMTBbwXWbzLWYdxr_ivyszGNHS7g" \
--ssl-no-revoke \
-H 'Content-Type: application/json' \
-X POST \
-d '{
  "contents": [{
    "parts": [{"text": "Dis bonjour en un seul mot."}]
  }]
}'
