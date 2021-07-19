// Подключаем плагины, которые будут использоваться в Gulp:
const {src, dest, series, watch} = require('gulp'); // подключаем необходимые инструменты
const concat = require('gulp-concat'); // 'gulp-concat' (для объединения файлов) и другие
// пакеты необходимо установить (например: npm i -D gulp-concat)
const htmlMin = require('gulp-htmlmin'); // Подключаем минификатор html
const autoprefixes = require('gulp-autoprefixer')
const cleanCSS = require('gulp-clean-css')
const svgSprite = require('gulp-svg-sprite')
const image = require('gulp-image')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify-es').default;
const notify = require('gulp-notify')
const sourcemaps = require('gulp-sourcemaps')
const del = require('del')
const browserSync = require('browser-sync').create()

const clean = () => {
    return del(['dist']) // Удаляем папку "dist"
}

const resources = () => {  // переносим все файлы из папки "sources" в папку "dist"
    return src('src/resources/**/')
        .pipe(dest('dist'))
}

const styles = () => { // Создаём Gulp task (одна задача), назовём его styles
    // Метод src() использует glob (шаблон поиска с использованием метасимволов, 
    // например **/*.js) для чтения файловой системы и создания потока Node. 
    // Он находит все подходящие файлы и считывает их в память для прохождения через поток.
    //  Для glob(s) должно быть найдено хотя бы одно совпадение, иначе src() выдаст ошибку.
    return src('src/styles/**/*.css') // ** означает, что будут получены все файлы
    // не только из этой папки (styles), но и из всех вложенных подпапок. 
        .pipe(sourcemaps.init()) // Инициализируем sourcemaps
        .pipe(concat('main.css')) // .pipe() для объединения потоков. Т.е. найденные 
        // файлы будут объединены в файл 'main.css'
        .pipe(autoprefixes({
            cascade: false // Про настройки плагинов смотрим в документации к плагинам
        }))
        .pipe(cleanCSS({
            level: 2 // Уровень очистки CSS (насколько сильно)
        }))
        .pipe(sourcemaps.write()) // Записываем sourcemaps
        .pipe(dest('dist')) // и помещены (dest-'destination') в папку 'dist'
        .pipe(browserSync.stream())
}

const stylesDev = () => { // Стили для разработки
    return src('src/styles/**/*.css')
        .pipe(concat('main.css'))
        .pipe(autoprefixes({
            cascade: false
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(dest('dist'))
        .pipe(browserSync.stream())
}

const htmlMinify = () => { // Создаём другой Gulp task (для минификации страниц)
    return src('src/**/*.html') // Получаем файлы, с которыми будем работать,
        .pipe(htmlMin({
            collapseWhitespace: true,  // удаляем пробелы
        }))
        .pipe(dest('dist')) // и помещены результат в папку 'dist'
        .pipe(browserSync.stream())
}
// Для того, чтобы можно было вызывать функцию styles в Gulp, воспользуемся экспортом.
// Экспортируем gulp task. Назовём его так же (styles) и присвоим значение styles

const svgSprites = () => {
    return src('src/images/svg/**/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg' // поднимаем на уровень выше и даём имя
                }
            }
        }))
        .pipe(dest('dist/images'))
}

const scripts = () => {
    return src([
        'src/js/components/**/*.js',
        'src/js/main.js'
      ])
      .pipe(sourcemaps.init()) // Инициализируем sourcemaps
      .pipe(babel({
          presets: ['@babel/env']
      }))
      .pipe(concat('app.js'))
      .pipe(uglify({
          toplevel: true
      }).on('error', notify.onError))
      .pipe(sourcemaps.write()) // Записываем sourcemaps
      .pipe(dest('dist'))
      .pipe(browserSync.stream())
}

const scriptsDev = () => { // Scripts для разработки
    return src([
        'src/js/components/**/*.js',
        'src/js/main.js'
      ])
      .pipe(babel({
          presets: ['@babel/env']
      }))
      .pipe(concat('app.js'))
      .pipe(dest('dist'))
      .pipe(browserSync.stream())
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: 'dist'
        }
    })
}

const images = () => { // Сжатие картинок
    return src([
        'src/images/**/*.jpg',
        'src/images/**/*.jpeg',
        'src/images/**/*.png',
        'src/images/*.svg',
    ])
    .pipe(image()) // Если не передавать настройки, применятся настройки по умолчанию
    .pipe(dest('dist/images'))
}

watch('src/**/*.html', htmlMinify) // Первый аргумент функции - за чем следим,
// второй - действия при изменении
watch('src/styles/**/*.css', styles)
watch('src/styles/**/*.svg', svgSprites)
watch('src/js/**/*.js', scripts)
watch('src/resources/**', resources)

exports.styles = styles // То есть, говорим: "Экспортируй" task (задание) "Styles", 
// в котором будет вызываться функция styles.
// И запускаем в командной строке командой gulp styles (Gulp должен быть установлен!)
exports.htmlMinify = htmlMinify
exports.scripts = scripts
exports.default = series(clean, resources, htmlMinify, scripts, styles, images, svgSprites, watchFiles) 
// Для выполнения серии задач командой gulp
exports.development = series(clean, htmlMinify, scriptsDev, stylesDev, images, svgSprites, watchFiles);
// Версия запуска для разработки