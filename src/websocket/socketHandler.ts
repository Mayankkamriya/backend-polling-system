/**
 * @fileoverview WebSocket handler for real-time polling communication
 * 
 * This module implements Socket.IO WebSocket functionality for the polling application.
 * Features:
 * - JWT-based authentication for WebSocket connections
 * - Real-time poll room management (join/leave)
 * - Live vote count updates via broadcasting
 * - New poll notifications
 * - Graceful error handling and cleanup
 * 
 * Real-time Events:
 * - poll-data: Initial poll data when joining a room
 * - poll-updated: Real-time vote count updates
 * - new-poll-published: Notifications for new published polls
 * - user-joined-poll / user-left-poll: Room presence updates
 * 
 * @author Move37 Ventures Developer
 * @version 1.0.0
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { JWTService } from '../utils/jwt';

/**
 * Prisma client instance for database operations
 * @type {PrismaClient}
 */
const prisma = new PrismaClient();

/**
 * Extended Socket interface with authentication and room tracking
 * @interface AuthenticatedSocket
 * @extends {Socket}
 */
interface AuthenticatedSocket extends Socket {
  /** Authenticated user's ID */
  userId?: string;
  /** Set of poll rooms the user has joined */
  currentPollRooms?: Set<string>;
}

/**
 * Poll data structure for WebSocket transmission
 * @interface PollData
 */
interface PollData {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
  }>;
  totalVotes: number;
  timestamp?: string;
}

/**
 * Sets up WebSocket server with authentication and real-time features
 * 
 * @param {Server} io - Socket.IO server instance
 * @returns {void}
 */
export const setupWebSocket = (io: Server): void => {
  /**
   * Authentication middleware for WebSocket connections
   * Verifies JWT token and attaches user information to socket
   * 
   * @param {AuthenticatedSocket} socket - Socket connection to authenticate
   * @param {Function} next - Callback to continue or reject connection
   */
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Extract token from auth object or Authorization header
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      // Verify JWT token
      const payload = JWTService.verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket for later use
      socket.userId = payload.userId;
      socket.currentPollRooms = new Set();
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  /**
   * Handle new WebSocket connections
   * Sets up event listeners for poll room management and real-time updates
   */
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User ${socket.userId} connected via WebSocket`);

    /**
     * Handle 'join-poll' event - User joins a poll room for real-time updates
     * 
     * @param {string} pollId - ID of the poll to join
     */
    socket.on('join-poll', async (pollId: string) => {
      try {
        // Validate pollId
        if (!pollId || typeof pollId !== 'string') {
          socket.emit('error', { message: 'Invalid poll ID provided' });
          return;
        }

        // Fetch poll with vote counts (only published polls)
        const poll = await prisma.poll.findUnique({
          where: { 
            id: pollId,
            isPublished: true 
          },
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            }
          }
        });

        if (!poll) {
          socket.emit('error', { message: 'Poll not found or not published' });
          return;
        }

        // Join the poll room
        const roomName = `poll-${pollId}`;
        await socket.join(roomName);
        socket.currentPollRooms?.add(roomName);

        // Prepare poll data for client
        const pollData: PollData = {
          id: poll.id,
          question: poll.question,
          options: poll.options.map(option => ({
            id: option.id,
            text: option.text,
            voteCount: option._count.votes
          })),
          totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0)
        };

        // Send initial poll data to the joining user
        socket.emit('poll-data', pollData);

        console.log(`📊 User ${socket.userId} joined poll room: ${roomName}`);

        // Notify other users in the room
        socket.to(roomName).emit('user-joined-poll', { 
          message: 'A user joined the poll',
          userCount: io.sockets.adapter.rooms.get(roomName)?.size || 1
        });

      } catch (error) {
        console.error('❌ Error joining poll room:', error);
        socket.emit('error', { message: 'Failed to join poll room' });
      }
    });

    // Leave a poll room
    socket.on('leave-poll', async (pollId: string) => {
      try {
        const roomName = `poll-${pollId}`;
        await socket.leave(roomName);
        socket.currentPollRooms?.delete(roomName);

        console.log(`User ${socket.userId} left poll room: ${roomName}`);

        socket.to(roomName).emit('user-left-poll', { 
          message: 'A user left the poll',
          userCount: io.sockets.adapter.rooms.get(roomName)?.size || 0
        });

      } catch (error) {
        console.error('Error leaving poll room:', error);
        socket.emit('error', { message: 'Failed to leave poll room' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from WebSocket`);

      if (socket.currentPollRooms) {
        socket.currentPollRooms.forEach(roomName => {
          socket.to(roomName).emit('user-left-poll', { 
            message: 'A user left the poll',
            userCount: Math.max(0, (io.sockets.adapter.rooms.get(roomName)?.size || 1) - 1)
          });
        });
      }
    });

    socket.on('error', (error) => {
      console.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  // Utility function to broadcast vote updates
  const broadcastVoteUpdate = async (pollId: string) => {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          }
        }
      });

      if (!poll) return;

      const roomName = `poll-${pollId}`;
      const pollData = {
        id: poll.id,
        question: poll.question,
        options: poll.options.map(option => ({
          id: option.id,
          text: option.text,
          voteCount: option._count.votes
        })),
        totalVotes: poll.options.reduce((sum, option) => sum + option._count.votes, 0),
        timestamp: new Date().toISOString()
      };

      io.to(roomName).emit('poll-updated', pollData);

      console.log(`Broadcasted vote update to room: ${roomName}`);
    } catch (error) {
      console.error('Error broadcasting vote update:', error);
    }
  };

  // Utility function to broadcast new poll
  const broadcastNewPoll = async (pollId: string) => {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          creator: {
            select: { name: true }
          },
          options: true
        }
      });

      if (!poll || !poll.isPublished) return;

      const pollData = {
        id: poll.id,
        question: poll.question,
        creatorName: poll.creator.name,
        options: poll.options,
        timestamp: new Date().toISOString()
      };

      io.emit('new-poll-published', pollData);

      console.log(`Broadcasted new poll publication: ${poll.question}`);
    } catch (error) {
      console.error('Error broadcasting new poll:', error);
    }
  };

  // Export utility functions
  io.broadcastVoteUpdate = broadcastVoteUpdate;
  io.broadcastNewPoll = broadcastNewPoll;
};

// Extend Server interface
declare module 'socket.io' {
  interface Server {
    broadcastVoteUpdate?: (pollId: string) => Promise<void>;
    broadcastNewPoll?: (pollId: string) => Promise<void>;
  }
}
