/**
 * @typedef {Object} JulesSource
 * @property {string} name
 * @property {string=} displayName
 * @property {Object=} githubRepo
 */

/**
 * @typedef {Object} JulesSession
 * @property {string} id
 * @property {string=} name
 * @property {string=} title
 * @property {string=} prompt
 * @property {string} state
 * @property {string=} createTime
 * @property {string=} updateTime
 * @property {Object=} sourceContext
 */

/**
 * @typedef {Object} JulesActivity
 * @property {string=} id
 * @property {string=} name
 * @property {string=} createTime
 * @property {Object=} progressUpdated
 * @property {Object=} userMessaged
 * @property {Object=} agentMessaged
 * @property {Object=} planGenerated
 * @property {Object=} planApproved
 * @property {Object=} sessionCompleted
 * @property {Object=} sessionFailed
 */

/**
 * @typedef {Object} Persona
 * @property {string} id
 * @property {string} label
 * @property {string} color
 * @property {string} prompt
 * @property {boolean=} isCustom
 */

/**
 * @typedef {Object} SessionDraft
 * @property {string=} id
 * @property {string=} source
 * @property {string=} branch
 * @property {string=} prompt
 * @property {boolean=} autoMode
 * @property {boolean=} reqApproval
 * @property {number=} createdAt
 * @property {number=} updatedAt
 */

/**
 * @typedef {Object} QuotaPlan
 * @property {string} id
 * @property {string} label
 * @property {number} daily
 * @property {number} concurrent
 * @property {string} model
 */

/**
 * @typedef {Object} NetworkSnapshot
 * @property {{in:number,out:number}} today
 * @property {{in:number,out:number}} month
 * @property {{in:number,out:number}} overall
 * @property {{in:number,out:number}} session
 * @property {number} total
 * @property {Array<Object>} log
 */

/**
 * @typedef {Object} PullRequestInfo
 * @property {string} url
 * @property {string|number} number
 * @property {string=} title
 * @property {string=} state
 * @property {number=} additions
 * @property {number=} deletions
 * @property {number=} changedFiles
 */

export {};
