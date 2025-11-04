(function(){
  function initMenu(root){
    try{
      var btn = root.querySelector('#mobile-menu-button');
      var menu = root.querySelector('#mobile-menu');
      if(!btn || !menu) return;
      function toggle(){
        var isHidden = menu.hasAttribute('hidden');
        if(isHidden) menu.removeAttribute('hidden'); else menu.setAttribute('hidden','');
        btn.setAttribute('aria-expanded', String(isHidden));
      }
      btn.addEventListener('click', toggle);
      // Close when clicking a link
      menu.addEventListener('click', function(e){
        var t = e.target;
        if (t && t.closest && t.closest('a')) {
          menu.setAttribute('hidden','');
          btn.setAttribute('aria-expanded','false');
        }
      });
      // Close when clicking outside the menu or button
      document.addEventListener('click', function(e){
        try{
          var t = e.target;
          if (!menu.contains(t) && !btn.contains(t)){
            if (!menu.hasAttribute('hidden')){
              menu.setAttribute('hidden','');
              btn.setAttribute('aria-expanded','false');
            }
          }
        }catch(_){/*noop*/}
      });
      // Close on escape
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ try{ menu.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); }catch(_){} } });
    }catch(_){/*noop*/}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ initMenu(document); });
  } else {
    initMenu(document);
  }
})();
