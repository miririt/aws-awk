const Arcalive = require('./arca');
const express = require('express');

class Worker {
  static initialize() {
    /**
     * @property Arcalive Sessions
     * @type {Object<string, Arcalive>}
     */
    this._sessions = {};
    this._workLog = [];
    this._expressRouter = express.Router();

    this._expressRouter.post('/subscribe', async (req, res, next) => {
      const board = await this._addBoard(req.body.boardId);
      if(board === null) {
        if(this._sessions[req.body.boardId]) {
          res.end(400);
        } else {
          res.end(401);
        }
        return;
      } else {
        if(~~req.body.quarantineCount !== 0) {
          const count = req.body.quarantineCount > 0 ? -~~req.body.quarantineCount : ~~req.body.quarantineCount;
          board.setQuarantineCount(count);
        }
        board.redact({
          pattern: new RegExp(req.body.deleteRule),
          type: 'delete'
        });

        board.redact({
          pattern: new RegExp(req.body.quarantineRule),
          type: 'quarantine'
        });

        board.redact({
          pattern: new RegExp(req.body.blockRule),
          type: 'block',
          duration: 31536000
        });
      }
      res.send('200 OK');
    });

    this._expressRouter.post('/unsubscribe', async (req, res, next) => {
      const hasPermission = Arcalive.checkPermission(req.body.boardId);
      if(hasPermission) {
        res.end(400);
        return;
      } else if(this._sessions[req.body.boardId]){
        res.end(400);
        return;
      }

      this._sessions[req.body.boardId].closeSession();
      delete this._sessions[req.body.boardId];
      res.send('200 OK');
    });

    this._expressRouter.get('/log/:boardId', (req, res, next) => {
      const boardLog = this._workLog.filter(log => log.boardId === req.params.boardId);
      res.send(boardLog);
    });

    this._expressRouter.get('/log', (req, res, next) => {
      res.send(this._workLog);
    });

    this._expressRouter.get('/sessions', (req, res, next) => {
      const sessionBoards = Object.keys(this._sessions);
      res.send(sessionBoards);
    });
  }

  /**
   * Add a board to watchlist.
   * @private
   * @param {string} boardId Board URL
   * @returns {Arcalive} Arcalive Session
   */
  static async _addBoard(boardId) {

    const checkResult = !this._sessions[boardId] && Arcalive.checkPermission(boardId);
    
    if(!checkResult) return null;

    const arca = new Arcalive(boardId);

    arca.on('delete', (article) => {
      this._log({
        boardId: boardId,
        type: 'delete',
        articleId: article._articleData.articleId
      });
    });
    
    arca.on('quarantine', (article) => {
      this._log({
        boardId: boardId,
        type: 'quarantine',
        articleId: article._articleData.articleId
      });
    });

    arca.on('block', (article) => {
      this._log({
        boardId: boardId,
        type: 'block',
        articleId: article._articleData.articleId
      });
    });

    return this._sessions[boardId] = arca;
  }

  /**
   * Log
   * @private
   */
  static _log(log) {
    this._workLog.push(log);
    while(this._workLog >= settings.server.logCount) {
      this._workLog.shift();
    }
  }

  /**
   * Get express.js router
   * @returns {express.Router}
   */
  static getRouter() {
    return this._expressRouter;
  }
};

module.exports = Worker;