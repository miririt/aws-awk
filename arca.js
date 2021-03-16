const settings = require('./settings');
const Arca = require('arcalive');

class Arcalive {

  static _session = new Arca.Session(settings.arcalive.username, settings.arcalive.password);
  
  /**
   * Create Arcalive session
   * 
   * @class
   * @param {string} username 
   * @param {string} password 
   * @param {string} boardId 
   */
  constructor(boardId) {
    this._listeners = {};
    this._watch = [];
  
    this._boardId = boardId;
    
    this._quarantineCount = -20;
    this._timeoutHandle = null;
  
    (async function() {
      this._board = await Arcalive._session.getBoard(boardId);
    }.bind(this))()
    .then(() => {
      this._lastArticleId = -1;
      this._lastCommentId = -1;
      this._checkedAggro = [];
      this._checkedQuarantine = [];
  
      this._checkArticles();
    });
  }

  static async checkPermission(boardId) {
    return await this._session._fetch(`https://arca.live/b/${boardId}`)
      .then(dom => dom.querySelector('.batch-delete-form') !== null);
  }

  async _checkArticles() {
    try {
      const articles = await this._board.readPage(1);
  
      const quarantineArticles = articles.filter(article => article._articleData.rateDiff <= this._quarantineCount);
      const newQuarantineArticles = quarantineArticles.filter(article => this._checkedQuarantine.indexOf(article.articleId) === -1);
  
      const newArticles = articles.filter(article => article.articleId > this._lastArticleId);
  
      newQuarantineArticles.forEach(quarantineArticle => {
        this._checkedQuarantine.push(quarantineArticle.articleId);
        this._dispatch('quarantine', [ quarantineArticle ]);
      })
  
      if(this._lastArticleId) {
        newArticles.forEach(async (article) => {
          const data = await article.read({ noCache: true, withComments: false });
          this._watch.forEach(rule => {
            const re = new RegExp(rule.pattern);
            if(re.exec(data.title) || re.exec(data.content)) {
              if(rule.type === 'delete') {
                article.delete();
                this._dispatch('delete', [ article ]);
              } else if(rule.type === 'quarantine') {
                this.quarantineArticle(article);
                this._dispatch('quarantine', [ article ]);
              } else if(rule.type === 'block') {
                article.blockUser(rule.duration);
                this._dispatch('block', [ article ]);
              }
            }
          });
        });
      }
  
      this._lastArticleId = articles[0].articleId;
      this._checkedQuarantine = this._checkedQuarantine.slice(this._checkedQuarantine.length - 30, this._checkedQuarantine.length);
    } catch(err) {
      console.error(err);
    }
  
    this._timeoutHandle = setTimeout(this._checkArticles.bind(this), 10000);
  };

  _dispatch(msg, args) {
    this._listeners[msg].forEach(listener => listener.apply(null, args));
  }

  _quarantineArticle(article) {
    const articleData = article._articleData;
  
    if(articleData.category === '운영') return;
  
    const editContent = `기존 카테고리 : ${articleData.category || '-'}<br>${articleData.content}`;
  
    article.edit({
      category: '운영',
      content: editContent
    });
  }

  on(msg, listener) {
    this._listeners[msg] = this._listeners[msg] || [];
  
    this._listeners[msg].push(listener);
  }

  setQuarantineCount(newCount) {
    this._quarantineCount = newCount;
  }

  redact(rule = {
    pattern: '',
    type: 'delete'
  }) {
    this._watch.push(rule);
  }

  cancelRedact(rule = {
    pattern: '',
    type: 'delete'
  }) {
    const index = this._watch.findIndex(rule => (rule.pattern === rule.pattern && rule.type === rule.type));
    this._watch.splice(index, 1);
  }

  closeSession() {
    delete this._watch;
    clearTimeout(this._timeoutHandle);
  }
}

module.exports = Arcalive;