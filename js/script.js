'use strict';

window.onload = function() {
    'use strict';
    var deck = Array.prototype.slice.call(document.getElementsByClassName('card')),
            suitSymbolEl = document.createElement('div'),
            fragment;

    suitSymbolEl.className = 'sign';

    deck.forEach(function(v, i) {
        fragment = document.createDocumentFragment();

        for (var c = 0, r = v.dataset.rank; c < r && r <= 10; c++) {
            fragment.appendChild(suitSymbolEl.cloneNode());
        }

        v.appendChild(fragment);
    });

    document.getElementById('solitair').addEventListener('click', function(ev) {
        var classList = ev.target.classList,
                elm = classList.contains('card') ? ev.target : Util.getParentBySelector(ev.target, '.card');

        if (elm) {
            elm.classList.toggle('show');
        }
    });

    var s = new Solitair('solitair');

};

