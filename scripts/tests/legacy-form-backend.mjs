// 由 R4-1c 遷移前的各站原始寫法擷取（git ee3a23b 時的 dev），作為共用模組表單協定的對照；不要修改。
export const LEGACY_FORM_VARIANTS = {
  status1: "async function fetchStudentStatus(id) {\n  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}`;\n  const response = await fetch(`${url}&_=${Date.now()}`, { cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  return response.json();\n}\n",
  status2: "async function fetchStudentStatus(id) {\n  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`;\n  const response = await fetch(url, { method: \"GET\", cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  return response.json();\n}\n",
  status3: "async function fetchStudentStatus(id) {\n  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`;\n  const response = await fetch(url, { cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  try {\n    return await response.json();\n  } catch {\n    throw new Error(\"backend_invalid_json\");\n  }\n}\n",
  status4: "async function fetchStudentStatus(id) {\n  const response = await fetch(`${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`, { cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  return response.json();\n}\n",
  post1: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(payload));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}`, { method: \"POST\", body });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `backend_${action}_failed`);\n  return data;\n}\n",
  post2: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify({ action, ...payload }));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`, {\n    method: \"POST\",\n    body,\n    cache: \"no-store\"\n  });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `${action}_failed`);\n  return data;\n}\n",
  post3: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(payload));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}`, {\n    method: \"POST\",\n    body,\n    cache: \"no-store\"\n  });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `${action}_failed`);\n  return data;\n}\n",
  post4: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  Object.entries(payload).forEach(([key, value]) => body.set(key, typeof value === \"object\" ? JSON.stringify(value) : String(value ?? \"\")));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}&_=${Date.now()}`, { method: \"POST\", body, cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `${action}_failed`);\n  return data;\n}\n",
  post5: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify({ action, ...payload }));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}`, { method: \"POST\", body });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `backend_${action}_failed`);\n  return data;\n}\n",
  post6: "async function postBackendAction(action, payload) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(payload));\n  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}&_=${Date.now()}`, { method: \"POST\", body, cache: \"no-store\" });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || `${action}_failed`);\n  return data;\n}\n",
  submit1: "async function submitAttemptToBackend(attempt) {\n  const payload = buildBackendPayload(attempt);\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(payload));\n  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: \"POST\", body });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || \"backend_submit_failed\");\n  return data;\n}\n",
  submit2: "async function submitAttemptToBackend(attempt) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(buildBackendPayload(attempt)));\n  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, {\n    method: \"POST\",\n    body\n  });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || \"backend_submit_failed\");\n  return data;\n}\n",
  submit3: "async function submitAttemptToBackend(attempt) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(buildBackendPayload(attempt)));\n  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, {\n    method: \"POST\",\n    body,\n    cache: \"no-store\"\n  });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || \"backend_submit_failed\");\n  return data;\n}\n",
  submit4: "async function submitAttemptToBackend(attempt) {\n  const body = new URLSearchParams();\n  body.set(\"payload\", JSON.stringify(buildBackendPayload(attempt)));\n  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: \"POST\", body });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json();\n  if (!data.ok) throw new Error(data.error || \"backend_submit_failed\");\n  return data;\n}\n",
  submit5: "async function submitAttemptToBackend(attempt) {\n  const body = new URLSearchParams(); body.set(\"payload\", JSON.stringify(buildBackendPayload(attempt)));\n  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: \"POST\", body });\n  if (!response.ok) throw new Error(`backend_${response.status}`);\n  const data = await response.json(); if (!data.ok) throw new Error(data.error || \"backend_submit_failed\"); return data;\n}\n",
};
export const LEGACY_FORM_STATIONS = {
  "scale": {
    "status": "status1",
    "post": "post1",
    "submit": "submit1"
  },
  "lab-entry": {
    "status": "status2",
    "post": "post2",
    "submit": "submit2"
  },
  "life-world": {
    "status": "status2",
    "post": "post3",
    "submit": "submit2"
  },
  "microscope-use": {
    "status": "status2",
    "post": "post2",
    "submit": "submit3"
  },
  "scientific-method": {
    "status": "status2",
    "post": "post2",
    "submit": "submit2"
  },
  "biological-organization": {
    "status": "status1",
    "post": "post4",
    "submit": "submit1"
  },
  "cell-basic-unit": {
    "status": "status3",
    "post": "post5",
    "submit": "submit4"
  },
  "cell-observation": {
    "status": "status1",
    "post": "post6",
    "submit": "submit1"
  },
  "cell-structure": {
    "status": "status2",
    "post": "post2",
    "submit": "submit3"
  },
  "cell-transport": {
    "status": "status4",
    "post": "post4",
    "submit": "submit5"
  },
  "nutrients-energy": {
    "status": "status1",
    "post": "post1",
    "submit": "submit1"
  },
  "nutrient-test": {
    "status": "status1",
    "post": "post1",
    "submit": "submit1"
  },
  "enzymes": {
    "status": "status1",
    "post": "post1",
    "submit": "submit1"
  }
};
