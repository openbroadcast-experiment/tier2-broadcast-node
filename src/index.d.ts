import fastify from 'fastify';

declare module 'fastify' {
    export interface FastifyRequest<> {
        jwt: string; // required to load containers
        powSolution: string;
        userDid: string;
    }
}