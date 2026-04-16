import { registerAs } from '@nestjs/config';  

export default registerAs( 
    'database',
    () => { //no expone ninguna variable, solo retorna un objeto de configuración. La función se ejecuta en tiempo de ejecución cuando se inyecta la configuración.

        if (!process.env.DATABASE_URL) {
            throw new Error('No se encontró una URL de conexión válida para la base de datos.');
        }

        return {
            url: process.env.DATABASE_URL,
        };
});

