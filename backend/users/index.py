import json
import os
import psycopg2

SCHEMA = 't_p67321282_messenger_nikolai_pr'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Регистрация пользователя и поиск по имени"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # POST /users — регистрация / обновление last_seen
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = (body.get('name') or '').strip()
        session_id = (body.get('session_id') or '').strip()

        if not name or not session_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'name and session_id required'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.users (name, session_id)
            VALUES (%s, %s)
            ON CONFLICT (session_id) DO UPDATE
              SET name = EXCLUDED.name, last_seen = NOW()
            RETURNING id, name, session_id
            """,
            (name, session_id)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': cors,
            'body': json.dumps({'id': row[0], 'name': row[1], 'session_id': row[2]})
        }

    # GET /users?name=... — поиск по имени
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        query = (params.get('name') or '').strip()
        exclude_session = (params.get('session_id') or '').strip()

        if len(query) < 2:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'name too short'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT id, name, session_id,
                   EXTRACT(EPOCH FROM (NOW() - last_seen)) < 300 AS online
            FROM {SCHEMA}.users
            WHERE LOWER(name) LIKE LOWER(%s)
              AND session_id != %s
            ORDER BY last_seen DESC
            LIMIT 10
            """,
            (f'%{query}%', exclude_session)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        users = [{'id': r[0], 'name': r[1], 'session_id': r[2], 'online': bool(r[3])} for r in rows]
        return {
            'statusCode': 200,
            'headers': cors,
            'body': json.dumps({'users': users})
        }

    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}
