const { db } = require('./database/database');

async function testComplexQuery() {
  try {
    const whereConditions = ['u.is_active = TRUE'];
    const queryParams = [];
    const whereClause = whereConditions.join(' AND ');
    
    const usersQuery = `
      SELECT 
        u.id,
        u.uuid,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        u.is_verified,
        u.last_login_at,
        u.created_at,
        COALESCE(GROUP_CONCAT(DISTINCT r.name SEPARATOR ','), '') as roles,
        COALESCE(GROUP_CONCAT(DISTINCT r.display_name SEPARATOR ','), '') as role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE ${whereClause}
      GROUP BY u.id, u.uuid, u.email, u.first_name, u.last_name, u.is_active, u.is_verified, u.last_login_at, u.created_at
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    console.log('Executing query:', usersQuery);
    const result = await db.query(usersQuery, [...queryParams, 10, 0]);
    console.log('Complex query result:', result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Complex query error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testComplexQuery();
