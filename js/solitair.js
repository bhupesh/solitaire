/**
 * Author Bhupesh Pranami (bpranami at live dot com)
 */
'use strict';

(function(global) {

    var Util = global.Util,
            doc = document,
            p = {};

    p.suits = ['spades', 'hearts', 'club', 'diamonds'];
    p.black = ['spades', 'club'];
    p.red = ['hearts', 'diamonds'];

    var Solitair = global.Solitair = function Solitair(id) {
        'use strict';
        var self = this, collection;
        self.el = doc.getElementById(id);

        collection = self.el.getElementsByClassName('card');
        self.cards = Array.prototype.slice.call(collection);
        self.deck = {};

        p.suits.forEach(function(v) {
            self.deck[v] = self.cards.filter(function(card) {
                return card.classList.contains(v);
            });
        });

        self.piles = [];
        self.foundation = doc.getElementById('foundation');
        self.foundationPiles = [].slice.call(self.foundation.children);
        self.pilesWrapper = doc.getElementById('piles-wrapper');
        self.remainingPile = doc.getElementById('remaining-pile');
        self.faceupContainer = self.remainingPile.querySelector('#pile-faceup');
        self.facedownContainer = self.remainingPile.querySelector('#pile-facedown');
        self.lastMovement = {lastCard: null, prevParent: null, prevSibling: null}

        self.init();

        Util.on('keypress', doc, function(e) {
//            if (e.ctrlKey && e.charCode === 122)
//                self.undo(e);
        });

        return this;
    };

    Solitair.prototype = {
        init: function() {
            var self = this;

            self.cards = Util.shuffle(self.cards);

            self.drawCards();

            // set up remaining pile
            Util.on('click', self.remainingPile, function(e) {
                e.preventDefault();
                var elm = e.target.classList.contains('card') ? e.target : null,
                        parent = e.target.classList.contains('card') ? e.target.parentNode : e.target;



                // if e.target matches the selector with facedown
                // process the card and display it
                if (elm && parent.id === 'pile-facedown') {
                    elm.draggable = true;
                    elm.classList.add('show');
                    self.remainingPile.querySelector('#pile-faceup').appendChild(elm);
                }

                // no card remained in facedown pile
                if (!elm && parent.id === 'pile-facedown') {
                    var faceupCards = self.faceupContainer.children;

                    for (var i = faceupCards.length - 1; i >= 0; i--) {
                        var card = faceupCards.item(i);
                        card.classList.remove('show');
                        self.facedownContainer.appendChild(card);
                    }
                }

            });

            Util.on('mousedown', self.pilesWrapper, function(e) {
                var elm = e.target,
                        classList = elm.classList;
                // if right click on hidden card, display it
                if (e.which === 3 && classList.contains('show')) {
                    self.handleRightClick(e);
                } else if (e.which === 1) {
                    // check if click is on the shown card, or else any of child element of shown card is clicked
                    elm = classList.contains('show') ? elm : Util.getParentBySelector(elm, '.show');

                    /**
                     * determine if the card is not the last child and is shown
                     * create wrapper around and drag that instead, so that it will have 
                     * all cards over it
                     */

                    if (elm) {
                        Util.on('dragstart', elm, function(e) {
                            self.startDrag(e);
                        });
                        Util.on('dragend', elm, function(e) {
                            self.endDrag(e);
                        });
                    }
                }
            });


            self.setFoundationDrop();
            self.setPilesDND();

        },
        getEmptyFoundation: function() {
            var self = this,
                    f = self.foundation.children;

            for (var i = 0, j = f.length; i < j; i++) {
                if (f.item(i).children.length === 0)
                    return f.item(i);
            }
        },
        _moveCard: function(card, dest) {
            var self = this;

            card.style.cursor = 'default';
            card.style.opacity = 1;

            self.lastMovement = {
                lastCard: card,
                prevParent: card.parentNode,
                prevSibling: card.previousElementSibling,
                prevTop: (card.previousElementSibling ? (parseInt(card.previousElementSibling.style.top, 10) + 1) : 0) + 'rem'
            };

            if (self.lastMovement.prevSibling) {
                self.lastMovement.prevSibling.classList.add('show');
            }

            dest.appendChild(card);
        },
        startDrag: function(e) {
            var self = this,
                    elm = e.target;

            elm.style.cursor = 'grab';
            elm.style.opacity = 0.7;

            if (typeof e.dataTransfer.mozSetDataAt === 'function')
                e.dataTransfer.mozSetDataAt('application/x-moz-node', elm, 0);
            else {
                self.srcElm = elm;
            }

            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.dropEffect = "move";
        },
        endDrag: function(e) {
            var elm = e.target;

            elm.style.cursor = 'pointer';
            elm.style.opacity = 1;
            Util.off('dragstart', elm);
            Util.off('dragend', elm);
        },
        dragEnter: function(e) {
            e.preventDefault();
        },
        dragOver: function(e) {
            e.preventDefault();
        },
        foundationDrop: function(e) {
            e.preventDefault();
            var self = this,
                    card, cardSuit,
                    dropTarget = e.target.classList.contains('droppable') ? e.target :
                    (e.target.classList.contains('card') ? e.target : Util.getParentBySelector(e.target, '.card')),
                    dropRank,
                    parent = dropTarget.classList.contains('droppable') ? dropTarget : dropTarget.parentNode;

            if (typeof e.dataTransfer.mozGetDataAt === 'function') {
                card = e.dataTransfer.mozGetDataAt('application/x-moz-node', 0);
            } else {
                card = self.srcElm;
            }

            cardSuit = card.dataset.suit;
            dropRank = dropTarget.dataset.rank || 0;
            if (+dropRank === (card.dataset.rank - 1)) {

                if (!parent.dataset.suit) {
                    parent.id = cardSuit;
                    parent.dataset.suit = cardSuit;
                } else if (parent.dataset.suit !== cardSuit) {
                    return false;
                }

                card.style.top = '';
                card.draggable = false;

                self._moveCard(card, parent);

            }

        },
        pilesDrop: function(e) {
            e.preventDefault();
            var self = this,
                    card, cardSuit,
                    // still need to figure out the dropTarget should be the last child with show class or piles container div
                    dropTarget = (e.target.classList.contains('show') ? e.target : Util.getParentBySelector(e.target, '.show')) || e.target,
                    dropRank,
                    parent = dropTarget.parentNode,
                    sibling = [], tmp;

            if (typeof e.dataTransfer.mozGetDataAt === 'function') {
                card = e.dataTransfer.mozGetDataAt('application/x-moz-node', 0);
            } else {
                card = self.srcElm;
            }

            cardSuit = card.dataset.suit;
            dropRank = dropTarget.dataset.rank || 14;
            if (+card.dataset.rank === (dropRank - 1)) {

                /**
                 * Check for the suit. black suit can only be dropped on red and vice versa.
                 * spades -> hearts, diamonds
                 * clubs -> hearts, diamonds
                 * hearts -> spades, clubs
                 * diamonds -> spades, clubs
                 * 
                 * If parent and dragged card suit belongs to same color, return
                 */
                if (dropRank !== 14 && ((p.black.indexOf(dropTarget.dataset.suit) === -1 && p.black.indexOf(cardSuit) === -1)
                        || p.red.indexOf(dropTarget.dataset.suit) === -1 && p.red.indexOf(cardSuit) === -1)) {
                    return false;
                }

                if (dropRank === 14)
                    parent = dropTarget;

                card.style.top = ((parseInt(dropTarget.style.top, 10) + 2) || 0) + 'rem';

                tmp = card;
                while (tmp = tmp.nextElementSibling) {
                    sibling.push(tmp);
                }

                self._moveCard(card, parent);
                sibling.forEach(function(v, i) {
                    v.style.top = parseInt(card.style.top) + 2 * (i + 1) + 'rem';
                    parent.appendChild(v);
                });

            }
        },
        setFoundationDrop: function() {
            var self = this;
            for (var i = 0, j = self.foundation.children.length; i < j; i++) {
                Util.on('dragenter', self.foundation.children.item(i), function(e) {
                    self.dragEnter(e);
                });
                Util.on('dragover', self.foundation.children.item(i), function(e) {
                    self.dragOver(e);
                });
                Util.on('drop', self.foundation.children.item(i), function(e) {
                    self.foundationDrop(e);
                });
            }
        },
        setPilesDND: function() {
            var self = this;

            // setup waste pile on top left
            Util.on('dragstart', self.remainingPile.querySelector('#pile-faceup'), function(e) {
                self.startDrag(e);
            });

            Util.on('dragend', self.remainingPile.querySelector('#pile-faceup'), function(e) {
                self.endDrag(e);
            });
            /**
             *  Setup 7 piles
             */
            for (var i = 0, j = self.pilesWrapper.children.length; i < j; i++) {
                Util.on('dragenter', self.pilesWrapper.children.item(i), function(e) {
                    self.dragEnter(e);
                });
                Util.on('dragover', self.pilesWrapper.children.item(i), function(e) {
                    self.dragOver(e);
                });
                Util.on('drop', self.pilesWrapper.children.item(i), function(e) {
                    self.pilesDrop(e);
                });
            }

            // add double click handler for each pile
            var ch = [].slice.call(self.pilesWrapper.children);
            ch.forEach(function(v, idx) {
                v.addEventListener('dblclick', function(e) {
                    var card = e.currentTarget.lastChild,
                            cardSuit = card.dataset.suit,
                            foundation = doc.getElementById(cardSuit) || self.getEmptyFoundation(),
                            highestInFoundation = foundation.lastChild ? foundation.lastChild.dataset.rank : 0,
                            prevCard = card.previousElementSibling;

                    if (card.dataset.rank - 1 === +highestInFoundation) {
                        card.style.top = '';
                        self._moveCard(card, foundation);
                        foundation.id = foundation.id || cardSuit;
                        if (prevCard)
                            prevCard.classList.add('show');
                    }
                });
            });
        },
        handleRightClick: function(ev) {
            ev.preventDefault();
            var elm = ev.target,
                    classList = elm.classList;

            Util.on('contextmenu', doc, function(ev) {
                ev.preventDefault();
                Util.off('contextmenu', doc);
            });

            classList.add('pullup');
            elm.style.zIndex = 1000;

            Util.on('mouseup', doc, function(ev) {
                ev.preventDefault();
                elm.classList.remove('pullup');
                elm.style.zIndex = '';

                Util.off('mouseup', doc);
            });

        },
        drawCards: function() {
            var self = this,
                    faceDownPile = self.remainingPile.querySelector('#pile-facedown');

            for (var i = 0; i < 7; i++) {
                self.piles[i] = self.cards.splice(0, i + 1);
            }

            self.piles.forEach(function(v, idx) {
                v.forEach(function(node, top) {
                    if (self.pilesWrapper.children.item(idx))
                        node.style.top = top + 'rem';

                    if (v.length - 1 === top)
                        node.classList.add('show');
                    self.pilesWrapper.children.item(idx).appendChild(node);
                });
            });

            self.cards.forEach(function(v, idx) {
                v.draggable = false;
                faceDownPile.appendChild(v);
            });

        },
        getSuit: function(suit) {
            var self = this;
            if (!suit || self.suits.indexOf(suit.toLowerCase()) === -1)
                return false;

            return self.deck[suit];
        },
        shuffle: function(suit) {
            return Util.shuffle(suit);
        },
        undo: function(e) {
            var self = this, tmp, sibling = [];

            if (!self.lastMovement.lastCard)
                return;

            if (self.lastMovement.prevSibling) {
                self.lastMovement.prevSibling.classList.remove('show');
            }

            self.lastMovement.lastCard.style.top = self.lastMovement.prevTop;
            self.lastMovement.prevParent.appendChild(self.lastMovement.lastCard);

            tmp = self.lastMovement.lastCard;
            while (tmp = tmp.nextElementSibling) {
                sibling.push(tmp);
            }

            sibling.forEach(function(v, i) {
                v.style.top = parseInt(self.lastMovement.lastCard.style.top) + (i + 1) + 'rem';
                self.lastMovement.prevParent.appendChild(v);
            });

            self.lastMovement = {lastCard: null, prevParent: null, prevSibling: null};

        }
    };

})(new Function('return this')());