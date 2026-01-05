
// Stack quản lý Movia lồng nhau
const moviaStack = [];

// Lấy Movia trên cùng trong stack
function getTopMovia() {
    return moviaStack[moviaStack.length - 1] || null;
}

export const MoviaGlobal ={
    defaultCloseMethods : ['button','overlay','escape'],
    defaultCssClass: [],
    destroyOnClose : false,
    autoSanitize: true, // cờ flag tự động làm sạch dữ liệu
    
    set(config = {})
    {
        Object.assign(this,config)
    }
}

let moviaIdCounter = 0;

export class Movia {
    footerButton = [];
    onOpen = null;
    onClose = null;
    constructor(config = {})
    {   // Tham số : dùng để nhận dữ liệu từ bên ngoài
        const defaultConfig = {
            templateId : null,
            content : "", 
            closeMethods : MoviaGlobal.defaultCloseMethods.slice() , // Các phương pháp đóng
            destroyOnClose : MoviaGlobal.destroyOnClose, // loại bỏ khỏi DOM
            footer : false, 
            cssClass : MoviaGlobal.defaultCssClass.slice() ,
            onOpen : null ,
            onClose : null,
            footerButton : [], // Button từ config ban đầu
        }
        const finalConfig = Object.assign({},defaultConfig,config);
        Object.assign(this,finalConfig); // sao chép toàn bộ thuộc tính vào this

        /* ===============================
           VALIDATE content / templateId
        =============================== */

        if(!this.content && !this.templateId)
        {
            throw new Error("Movia requires either 'content' or 'templateId' to be provided.");
        }

        if(this.content && this.templateId)
        {
            this.templateId = null;
            console.warn("Both 'content' and 'templateId' are provided. 'templateId' will take precedence.");
        }

        if (this.templateId) {
            const template = document.getElementById(this.templateId);

            if (!template) {
                throw new Error(
                `[Movia] Template with id "${this.templateId}" does not exist.`
                );
            }
                this.template = template; // lưu lại để render
        } else {
            this.template = null;
        }


        // Thuộc tính : lưu dữ liệu cho từng đối tượng
        // Trạng thái (sống) runtime
        this.id = ++moviaIdCounter; // ID của movia 
        this.isOpen = false; // mặc định chưa mở
        this.backdrop = null; // khởi tạo biến để sau này lưu DOM của backdrop, 
        this.footerElement = null;
        this.contentElement = null;

        // Pending states : trạng thái chờ xử lý
        this._pendingContent = null;
        this._pendingFooterButtons = []; // Button thêm trực tiếp lúc đang mở
        this._pendingFooterContent = null; // Nội dung chân trang có thể thêm
        this._footerInitialized = false; // Footer đã được render từ dữ liệu được truyền vào hay chưa
        
        this._keydownHandler = null; // Hành vi xử lý
        this._childMovias = []; // List movia

    }

    // Tạo DOMmovia 
    createMovia() {
        if (this.backdrop) return this.backdrop;

        // Tạo backdrop
        const backdrop = document.createElement("div");
        backdrop.className = "movia";
        backdrop.id = `movia-${this.id}`

        // Tạo container
        const container = document.createElement("div");
        container.className = "movia__container";

        // Kiểm tra mảng css truyền vào
        if(Array.isArray(this.cssClass) && this.cssClass.length)
        {
            this.cssClass.forEach(cls => 
            {
                if(typeof cls === "string" && cls.trim())
                {
                    container.classList.add(cls)
                }
            });
        }
        
        // Thêm nút close nếu có 'button' trong closeMethods
        if(Array.isArray(this.closeMethods) && this.closeMethods.includes('button')){

            const closeBtn = this._createButton("&times;","movia__close" ,this.close.bind(this))
            container.appendChild(closeBtn)
            // Đóng movia khi nhấn nút close
        }
        
        // Tạo movia__content
        const moviaContent = document.createElement("div");
        moviaContent.className = "movia__content";
        
        
        // Lấy template hoặc content
        if (this.templateId) {
            const template = document.getElementById(this.templateId);
            if (template && template.content) {
                moviaContent.appendChild(template.content.cloneNode(true));
            }
            else {
                moviaContent.innerHTML = String(this.content ?? "");
            }
        } else {
            moviaContent.innerHTML = String(this.content ?? "");
        }
        
        this.contentElement = moviaContent;
        container.append(moviaContent);
        

        // Đóng movia khi click overlay
        if (Array.isArray(this.closeMethods) && this.closeMethods.includes("overlay")) {
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) this.close();
            });
        }

        // ESC key - trường hợp movia lồng nhau thì nó đóng cái cuối
        if(Array.isArray(this.closeMethods) && this.closeMethods.includes('escape'))
        {
            this._keydownHandler = (e) =>{
                if (e.key === "Escape")
                {   
            // nó sẽ đóng movia trên cùng (movia lồng nhau)
                    const top = getTopMovia();
                    if(top === this){
                        this.close();
                    }
                }     
            }
        }

        // Tạo phần Footer (chân trang)
        if(this.footer)
        {
            const moviaFooter = document.createElement("div");
            moviaFooter.className = 'movia__footer';

            // Lưu lại để có thể thay đổi biến Footer
            this.footerElement = moviaFooter 
            
            this._renderFooter(); // render footer lần đầu từ config    
            container.appendChild(moviaFooter);
        }

        backdrop.append(container);
        this.backdrop = backdrop; // lưu lại biến
        return backdrop;
    }

    // Thay đổi nội dung content
    updateContent(html)
    {
        if(MoviaGlobal.autoSanitize)
        {
            html = this.sanitizeHTML(html);
        }
        
        // Nếu chưa từng tạo movia(chưa open)
        if(!this.backdrop)
        {
            this._pendingContent = html;
            return ;
        }
        const contentEl = this.backdrop.querySelector(".movia__content")
        if(this.isOpen && contentEl)
        {
            contentEl.innerHTML = html;
        } else{
            this._pendingContent = html;
        }
        this.content = html;
    }

    // Thay đổi Footer theo ý muốn 
    setFooterContent(html)
    {   
        if(MoviaGlobal.autoSanitize)
        {
            html = this.sanitizeHTML(html);
        }
        
        // Nếu footer chưa được tạo (movia chưa mở)
        if(!this.footerElement) {
            this._pendingFooterContent = html;
            return;
        }
        
        // Nếu footer đã tồn tại (movia mở) → cập nhật ngay
        this.footerElement.innerHTML = html;
    }

    // Lọc HTML an toàn - tránh XSS
    sanitizeHTML(html) {
        // Bật/ tắt tính năng lọc HTML
        if(!MoviaGlobal.autoSanitize)
        {
            return String(html ?? "");
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(String(html), "text/html");

        const dangerousTags = ["script", "iframe", "embed", "object", "link", "meta"];
        const dangerousAttrs = ["onerror", "onclick", "onload", "oninput", "onchange", "onmouseover"];
        
        // 1. XÓA TAG NGUY HIỂM
        dangerousTags.forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
        });

        // 2. Lọc attribute nguy hiểm
        doc.querySelectorAll("*").forEach(el => {
            [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                const value = attr.value;

                // Xóa bất kỳ on* event
                if (name.startsWith("on")) {
                    el.removeAttribute(name);
                    return;
                }

                // Xóa attribute nguy hiểm theo whitelist
                if (dangerousAttrs.includes(name)) {
                    el.removeAttribute(name);
                    return;
                }

                // Chặn javascript: trong href / src
                if (
                    (name === "href" || name === "src") &&
                    value.trim().toLowerCase().startsWith("javascript:")
                ) {
                    el.removeAttribute(name);
                    return;
                }
            });
        });

        return doc.body.innerHTML;
    }


    // Kiểm tra những trường hợp label(addFooterButton)
    renderLabel(input)
    {
        // Trường hợp DOM node → thêm trực tiếp
        if(input instanceof HTMLElement){
            return input.cloneNode(true);
        }

        // Trường hợp function → gọi nó 
        if(typeof input === "function")
        {   
            try{
                return this.renderLabel(input());
            } catch(err)
            {
                return this._createSpan(String(err));
            }
        }   

        // Không phải string → chuyển thành text
        if(typeof input !== "string"){
            return this._createSpan(String(input));
        }

        if(!/[<>]/.test(input))
        {
            return this._createSpan(input);
        }

        const span = document.createElement("span");
        span.innerHTML = this.sanitizeHTML(input);
        return span
    }

    _createSpan(text)
    {
        const span = document.createElement("span");
        span.textContent = String(text);
        return span;
    }

    _createButton(label,classNames = "",onClick = null)
    {
        const btn = document.createElement("button");
        btn.type = "button";

        if(Array.isArray(classNames))
        {   
            // Lọc giá trị Truthy và add vào classList
            classNames.filter(Boolean).forEach(cls => btn.classList.add(cls));
        } else if (typeof classNames === "string" && classNames.trim())
        {
            // băm nhỏ phần tử kể cả có nhiều dấu space liên tục
            classNames.split(/\s+/).forEach(cls => btn.classList.add(cls));
        }
        
        if(typeof onClick === "function")
        {
            btn.addEventListener("click", (e) => {
                onClick.call(this,e)
            });
        }

        if(typeof label === "string" && /^&[a-zA-Z0-9]+;?$/.test(label))
        {
            btn.innerHTML = label;
        } else {
            const rendered = this.renderLabel(label);
            if(rendered instanceof DocumentFragment)
            {
                btn.appendChild(rendered);
            } else {
                btn.appendChild(rendered);
            }
        }
        return btn;
    }
    
    addFooterButton(btnConfig = {}) {
        if (!btnConfig || typeof btnConfig !== "object") return;

        const exists = this.footerButton.some(
            btn => btn.label === btnConfig.label
        );
        if (exists) return;

        this.footerButton.push({
            label: btnConfig.label,
            classNames: btnConfig.classNames,
            onClick: btnConfig.onClick
        });

        // Nếu footer đang mở → render lại
        if (this.footerElement) {
            this._renderFooter();
        }
    }
    
    _renderFooter() {
        if (!this.footer || !this.footerElement) return;

        // Clear sạch footer
        this.footerElement.innerHTML = "";

        // Render footer content nếu có
        if (this._pendingFooterContent !== null) {
            this.footerElement.innerHTML = this._pendingFooterContent;
        }

        // Render buttons từ DATA
        this.footerButton.forEach(cfg => {
            const btn = this._createButton(
                cfg.label,
                cfg.classNames,
                cfg.onClick
            );
            this.footerElement.appendChild(btn);
        });
    }
    

    // Đăng ký Movia con(lồng nhau)
    setupChildMovia(childMovia)
    {
        if(!childMovia) return;
        this._childMovias.push(childMovia);

        if(this.isOpen && this.backdrop)
        {
            this._attachChildOpenHandler(childMovia);
        }
    }

    // Gắn sự kiện mở Movia con
    _attachChildOpenHandler(childMovia)
    {
        if(!this.backdrop) return ;
        this.backdrop.addEventListener("click",(e)=>{
            const btn = e.target.closest("[data-open-movia]");
            if(!btn) return ;
            const openId = btn.dataset.openMovia ?? btn.getAttribute("data-open-movia");
            if(!openId) return;
            if(openId === childMovia.templateId || openId === String(childMovia.id))
            {
                childMovia.open();
            }
        });
    }

    // Mở Movia 
    open() {
        if (this.isOpen) return; // Nếu mở movia thì quay lại
        this.isOpen = true;
        
        // Push stack movia 
        moviaStack.push(this);
        

        // Kiểm tra biến DOM của backdrop / tạo mới biến DOM
        // close() / destroy(false)  || close(true)/ destroy(true)
        const backdrop = this.backdrop || this.createMovia();

        // Nếu vừa tạo → gắn event mở movia con
        if (this._childMovias.length) {
            this._childMovias.forEach(child => {
                this._attachChildOpenHandler(child);
            });
        }

        // Add vào DOm nếu chưa có
        if (!document.body.contains(backdrop)){
            document.body.appendChild(backdrop);
        } 

        // Content có thể thay đổi 
        if(this._pendingContent !== null)
        {
            const contentEl = backdrop.querySelector(".movia__content");
            if(contentEl)
            {
                contentEl.innerHTML = this._pendingContent;
            }
            this._pendingContent = null;
        }

        // thêm event Escape trong Open() để tắt movia 
        if (this._keydownHandler) {
            document.addEventListener("keydown", this._keydownHandler);
        }

        
        // đóng cuộn trang ở bên ngoài
        const scrollbarWidth = this._getScrollbarWidth();
        document.body.classList.add("movia--no-scroll");

        const prePaddingRight = document.body.style.paddingRight || "";
        document.body.style.paddingRight = `${(parseFloat(prePaddingRight) || 0) + scrollbarWidth}px`;
        this._preBodyPaddingRight = prePaddingRight;
        
        // reset trạng thái nếu bị ẩn trước đó
        backdrop.style.visibility = "";
        requestAnimationFrame(() => {
            backdrop.classList.add("movia--show");
        });

        // Thêm hiệu ứng show - đáp ứng yêu cầu cùng 1 movia 
        requestAnimationFrame(() => {
            backdrop.dispatchEvent(new CustomEvent("movia:ready"));
            if (typeof this.onReady === "function") {
                try{
                    this.onReady();
                } catch(err)
                {
                    console.log(err);
                }
            }
        });

        this._onTransitionEnd(backdrop,()=>{
                // Khôi phục nơi vị trí người dùng đang đọc
                
                if (typeof this._saveScroll === "number") {
                    const moviaContent = backdrop.querySelector(".movia__content");
                    if (moviaContent) {
                        moviaContent.scrollTop = this._saveScroll;
                    }
                }
                
                if (typeof this.onOpen === "function") {
                    try{
                        this.onOpen();
                    } catch(err) {
                        console.error(err);
                    }
                }
        })
    }

    // Đóng Movia 
    close(forceDestroy = false) {
        // Nếu mà đóng/ chưa có gì thì quay lại        
        if (!this.isOpen || !this.backdrop) return; 

        // Xóa movia khỏi stack
        const index = moviaStack.indexOf(this);
        if(index !== -1 ) {
            moviaStack.splice(index,1);
        }

        this.isOpen = false; // mặc định đóng

        const backdrop = this.backdrop;
        
        // Lưu vị trí người dùng đang đọc
        const moviaContent = backdrop.querySelector(".movia__content");
        this._saveScroll = moviaContent.scrollTop;

        // Mở lại cuộn trang ngoài cùng 
        // đóng tất cả movia thì trang cuối mở scroll
        if(!moviaStack.length){
            document.body.classList.remove("movia--no-scroll");
            if(typeof this._preBodyPaddingRight !== "undefined")
            {
                document.body.style.paddingRight = this._preBodyPaddingRight;
                delete this._preBodyPaddingRight;
            }
            document.body.style.paddingRight = "";
        } else {
            const scrollbarWidth = this._getScrollbarWidth();
            document.body.style.paddingRight = `${scrollbarWidth}px`
        }

        // Xóa backdrop với transition
        backdrop.classList.remove("movia--show");

        // Xóa event Escape trong Close() để tắt movia 
        if (this._keydownHandler) {
            document.removeEventListener("keydown", this._keydownHandler);
        }
        
        // Trường hợp movia có scrollBar(thanh cuộn) thì ko gỡ khỏi DOM 
        let willDestroy;
        if(this.destroyOnClose === null || typeof this.destroyOnClose === "undefined")
        {
            const moviaContainer = backdrop.querySelector(".movia__container")
            const hasScroll = moviaContainer.scrollHeight > moviaContainer.clientHeight;
            willDestroy = !hasScroll;
        } else {
            // Kiểm tra trường hợp close(true)/destroy() hay close(false)
           willDestroy = forceDestroy || this.destroyOnClose;
        }

        this._onTransitionEnd(backdrop,() => {
                if(willDestroy)
                {
                    backdrop.remove();// Xóa khỏi DOM
                    this.backdrop = null;  // Rest về rỗng
                    this.footerElement = null; // Reset để lần mở sau tạo lại
                    this._footerInitialized = false;

                    // reset footerButton để không append lại
                    this._pendingFooterButtons = [];
                    this._pendingFooterContent = null;
                    this._pendingContent = null;
                } else{
                    backdrop.style.visibility = "hidden"; // Nó chỉ ẩn
                }


                if(typeof this.onClose === 'function')
                {
                    try{
                        this.onClose();
                    } catch(err)
                    {
                        console.log(err);
                    }
                }
        })
        
    }

    destroy()
    {
        this.close(true);
    }

    // đợi kết thúc transition CSS
    _onTransitionEnd(backdrop, callback) 
    {
        // Không có animation → gọi callback
        if (!backdrop) {
            callback?.(); // Kiểm tra bên trái nếu null/undefined thì trả về undefined
            return;
        }

        let finished = false; 

        // Hàm kết thúc DUY NHẤT
        const finish = () => {
            if (finished) return;   // chặn gọi lại
            finished = true;

            backdrop.removeEventListener("transitionend", onTransitionEnd);
            clearTimeout(timeoutId);

            try {
                callback?.();
            } catch (err) {
                console.error(err);
            }
        };

        // Khi CSS transition kết thúc
        const onTransitionEnd = (e) => {
            // chỉ xử lý transition của chính backdrop
            if (e.target !== backdrop) return;
            finish();
        };

        // Nghe transitionend
        backdrop.addEventListener("transitionend", onTransitionEnd);

        // Dự phòng: nếu không có transition thì tự kết thúc
        const timeoutId = setTimeout(finish, 350);
    }

    _getScrollbarWidth()
    {
        if (typeof this._scrollbarWidth === "number"){
            return this._scrollbarWidth;
        }

        const div = document.createElement("div");
        Object.assign(div.style, {
            overflow: "scroll",
            position: "absolute",
            top: "-9999px",
            width: "100px",
            height: "100px"
        });

        document.body.appendChild(div);
        this._scrollbarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);

        return this._scrollbarWidth;
    }
} 