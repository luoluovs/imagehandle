/**
 * 位："位(bit)"是电子计算机中最小的数据单位。每一位的状态只能是0或1。
 * 字节：8个二进制位构成1个"字节(Byte)"，它是存储空间的基本计量单位。1个字节可以储存1个英文字母或者半个汉字，换句话说，1个汉字占据2个字节的存储空间。
 * 字："字"由若干个字节构成，字的位数叫做字长，不同档次的机器有不同的字长。例如一台8位机，它的1个字就等于1个字节，字长为8位。如果是一台16位机，那么，它的1个字就由2个字节构成，字长为16位。字是计算机进行数据处理和运算的单位.
 * KB：这时K表示1024，也就是2的10次 方。1KB表示1K个Byte，也就是1024个字节。
 * MB：1048576字节，即 1MB = 2E+20 Bytes = 1048576Bytes。
 *
 *
 *
 * @type {{}}
 */

class ImageHandle{

    constructor(){

    }

    /**
     * 图片压缩
     * 定义一些配置
     * fileData 上传input标签id
     * callback 回调函数
     * quality  图片压缩的质量大小  值取  0-1 中的一位小数
     * width   	压缩后的图片宽度，默认0，即为原宽度
     * height 	压缩后的图片高度，默认0，即为原高度
     * imageType 文件压缩类型 默认jpg
     * lockScale 是否锁定宽高比，如果锁定且设定了width，那高度将按照原图片比较自动设定
     */
    compress(id,callback,quality = 0.6,width=0,height=0,imageType = "image/jpeg",lockScale=false){
        if(!id) throw new  Error('input ID为'+ID+'的节点不存在');
        this.fileData = document.getElementById(id);
        this.quality = quality;
        this.width = width;
        this.height = height;
        this.lockScale = lockScale;
        this.imageType = imageType;
        // 声明保存图片base64数据的变量
        let file_base64 = '';
        let _that = this;

        this.fileData.onchange = function(){
            // 步骤1，获取图片文件
            let file = _that.fileData.files[0];
            // 步骤2，利用fileReader把文件转化为base64。fileReader是JS内置的一个对象，具体用法可用搜下。
            // 创建fileReader对象
            let fileReader = new FileReader();
            // fileReader把文件转化为base64，让文件读取完成后，会触发FileReader的onload方法。
            fileReader.readAsDataURL(file);
            // 在onload方法中处理后续事件
            fileReader.onload = function(event) {
                // 步骤3. 创建图片对象，获取处理图片宽高，方便后面计算压缩率
                file_base64 = this.result;
                var size = _that.convertBase64UrlToBlob(file_base64).size;
                // 新建一个图像对象，用来获取老图片的原始尺寸
                let img = new Image();
                img.src = file_base64;

                // 在图片完成加载后继续处理后面的
                img.onload = function(){
                    // 获取图片的宽高
                    let img_width = this.width;
                    let img_height = this.height;
                    // 步骤4，创建canvas，用这个的目的，一是drawImage方法可用改变图片的尺寸，二是toDataURL可用改变图片的质量，达到压缩的目的
                    // toDataURL只能改变JPG的质量，但是这段代码偶尔也能压缩PNG，有时变大，有时变小，比较随缘。
                    let canvas = document.createElement('canvas');
                    let ctx = canvas.getContext('2d');

                    // 根据先前定义的配置来获得最终的图片尺寸，纯逻辑计算，不再详细解释
                    let final_width = _that.width || img_width;
                    let final_height = '';

                    if (_that.lockScale) {
                        var scale = img_width/img_height;
                        final_height = img_width/scale;
                    } else {
                        final_height = _that.height || img_height;
                    }

                    // 利用createAttribute和setAttributeNode为canvas添加宽高，如果对这个有点懵逼，请自行复习JS基础
                    let cwa = document.createAttribute('width');
                    cwa.nodeValue = final_width;
                    canvas.setAttributeNode(cwa);
                    let cwh = document.createAttribute('height');
                    cwh.nodeValue = final_height;
                    canvas.setAttributeNode(cwh);
                    // 将图片画在cancas上，drawImage的具体用法，不懂可用自己查
                    // 下面一句话意思就是把修改尺寸后的图片不做裁剪的画在canvas上
                    ctx.drawImage(this, 0, 0, final_width, final_height);
                    // 步骤5，把canvas转化为base64，可用直接当做图片链接使用
                    // 这里直接写死了image/jpeg类型，其实这个也可用设置为变量
                    file_base64 = canvas.toDataURL(_that.imageType, _that.quality);
                    // 步骤6，将base64塞入img标签中进行预览
                    _that.file_base64 = file_base64;
                    // 将base64转化为blob，如果图片需要上传至后台，则需要这一步，然后再利用FormData进行上传
                    let blob = _that.convertBase64UrlToBlob(file_base64);

                    //原大小
                    _that.OriginalSize = size;
                    //现大小
                    _that.BlobSize = blob.size;
                    //压缩率
                    let rate = ((blob.size/size) * 100).toFixed(2);
                    _that.rate = rate;
                    if(callback){
                        _that.callback(callback);
                    }
                }
            }
            // 图片读取失败的回调
            fileReader.onerror = function(event) {
                console.log(event);
                throw new  Error('图片解析错误');
            }
        }
        return this;
    }

    /**
     * 分段上传实现
     * @param id input表单的id
     * @param callback 回调函数
     * @param step 每段切片长度，默认2048
     */
    section(id,callback,step = 2048){
        if(!id) throw new  Error('input ID为'+ID+'的节点不存在');
        this.fileData = document.getElementById(id);
        let _that = this;
        this.bufArr = [];
        _that.fileData.onchange = function(){
            // 步骤1，获取图片文件
            let file = _that.fileData.files[0];
            // 步骤2，利用fileReader把文件转化为base64。fileReader是JS内置的一个对象，具体用法可用搜下。
            let reader = new FileReader();		// 构建文件读取对象
            reader.readAsArrayBuffer(file);		// 以流的方式读取文件到对象的result属性中
            reader.onload = function(){				// 由于是异步加载，绑定读取成功事件，在事件中分段读取上传
                let start = 0;				// 定义起始位置
                let len = this.result.byteLength;// 获取文件总长度
                _that.len = len;
                while(start < len){					// 循环切片
                    let end = start + step;			// 定义本次切片结束为止
                    end = end > len ? len : end;	// 判断结束为止是否超过总文件长度，如果超过则结束为止为文件总长度
                    let buf = _that.blobSlice(this.result, start, end);	// 切片函数对流切片
                    _that.bufArr.push(buf);
                    _that.currentBuf = buf;
                    // upload(buf)						// 上传方法
                    if(callback){
                        _that.callback(callback);
                    }
                    start = end;					// 将开始位置同步到结束位置
                }
            }

        }
    }

    /**
     * 切片函数，主要做兼容性处理
     *
     */
    blobSlice(blob, start, length) {
        if (blob.slice) {
            return blob.slice(start, length)
        } else if (blob.webkitSlice) {
            return blob.webkitSlice(start, length)
        } else if (blob.mozSlice) {
            return blob.mozSlice(start, length)
        } else {
            return null
        }
    }

    /**
     * 事件处理完成的回调函数
     * @param func
     */
    callback(func){
        func(this);
    }

    /**
     * 将base64转化为blob
     * @param urlData
     * @returns {Blob}
     */
    convertBase64UrlToBlob(urlData) {
        let arr = urlData.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type: mime});
    }

}
