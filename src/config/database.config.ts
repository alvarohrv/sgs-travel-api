import { registerAs } from '@nestjs/config';  

export default registerAs( 
    'database',
    () => { //no expone ninguna variable, solo retorna un objeto de configuración. La función se ejecuta en tiempo de ejecución cuando se inyecta la configuración.

        const isProduction = process.env.NODE_ENV === 'production';
        const databaseUrl = isProduction
            ? (process.env.MYSQL_URL || process.env.DATABASE_URL)
            : (process.env.DATABASE_URL || process.env.MYSQL_URL);

        return {
            host: process.env.MYSQLHOST || 'localhost',
            port: parseInt(process.env.MYSQLPORT || '3306', 10),
            user: process.env.MYSQLUSER || 'root',
            password: process.env.MYSQLPASSWORD || 'root',
            database: process.env.MYSQLDATABASE || 'my_local_db',
            // En production prioriza MYSQL_URL (Railway). En local prioriza DATABASE_URL.
            url: databaseUrl,
            isProduction,
        };
});

