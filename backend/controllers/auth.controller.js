/**
 * ============================================
 * CONTROLADOR DE AUTENTICACIÓN
 * ============================================
 * Maneja el registro, login, perfil y cambio de contraseña de usuarios.
 * Es usado por las rutas definidas en routes/auth.routes.js.
 * Cada función recibe (req, res) de Express y responde con JSON.
 */

const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');
const { deleteFile } = require('../config/multer');

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,}$/;
const PASSWORD_MIN_LENGTH = 6;

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const validarCamposRegistro = (tipo_documento, documento, nombre, apellido, email, password) => {
    if (!tipo_documento || !documento || !nombre || !apellido || !email || !password) {
        return { valid: false, message: 'Faltan campos requeridos: tipo_documento, documento, nombre, apellido, email y password son obligatorios' };
    }
    return { valid: true };
};

const validarEmail = (email) => {
    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, message: 'Formato de email inválido' };
    }
    return { valid: true };
};

const validarPassword = (password) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` };
    }
    return { valid: true };
};

const validarLogin = (email, password) => {
    if (!email || !password) {
        return { valid: false, message: 'Email y contraseña son requeridos' };
    }
    return { valid: true };
};

const validarUsuarioActivo = (usuario) => {
    if (!usuario.activo) {
        return { valid: false, message: 'Usuario inactivo. Contacte al administrador' };
    }
    return { valid: true };
};

const validarCredenciales = (usuario, password) => {
    if (!usuario) {
        return { valid: false, message: 'Credenciales inválidas' };
    }
    
    const usuarioActivo = validarUsuarioActivo(usuario);
    if (!usuarioActivo.valid) {
        return usuarioActivo;
    }
    
    return { valid: true, usuario };
};

const validarCambioPassword = (passwordActual, passwordNueva) => {
    if (!passwordActual || !passwordNueva) {
        return { valid: false, message: 'Se requiere contraseña actual y nueva contraseña' };
    }
    if (passwordNueva.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` };
    }
    return { valid: true };
};

const prepararRespuestaUsuario = (usuario) => {
    const usuarioRespuesta = usuario.toJSON();
    delete usuarioRespuesta.password;
    return usuarioRespuesta;
};

const generarTokenRespuesta = (usuario, mensaje, status = 200) => {
    const token = generateToken({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
    });
    
    return {
        success: true,
        message: mensaje,
        data: {
            usuario: prepararRespuestaUsuario(usuario),
            token
        }
    };
};

// ─────────────────────────────────────────────────────────────
// REGISTRAR USUARIO
// ─────────────────────────────────────────────────────────────

const register = async (req, res) => {
    try {
        const { tipo_documento, documento, nombre, apellido, email, password, telefono, direccion } = req.body;
        
        // Validaciones
        const camposValid = validarCamposRegistro(tipo_documento, documento, nombre, apellido, email, password);
        if (!camposValid.valid) {
            return res.status(400).json({ success: false, message: camposValid.message });
        }
        
        const emailValid = validarEmail(email);
        if (!emailValid.valid) {
            return res.status(400).json({ success: false, message: emailValid.message });
        }
        
        const passwordValid = validarPassword(password);
        if (!passwordValid.valid) {
            return res.status(400).json({ success: false, message: passwordValid.message });
        }
        
        // Verificar email existente
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            tipo_documento,
            documento,
            nombre,
            apellido,
            email,
            password,
            telefono: telefono || null,
            direccion: direccion || null,
            rol: 'cliente'
        });
        
        const response = generarTokenRespuesta(nuevoUsuario, 'Usuario registrado exitosamente', 201);
        res.status(201).json(response);
        
    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const loginValid = validarLogin(email, password);
        if (!loginValid.valid) {
            return res.status(400).json({ success: false, message: loginValid.message });
        }
        
        const usuario = await Usuario.scope('withPassword').findOne({ where: { email } });
        
        const credencialesValid = validarCredenciales(usuario, password);
        if (!credencialesValid.valid) {
            return res.status(401).json({ success: false, message: credencialesValid.message });
        }
        
        const passwordValida = await usuario.compararPassword(password);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const response = generarTokenRespuesta(usuario, 'Inicio de sesión exitoso');
        res.json(response);
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// OBTENER PERFIL
// ─────────────────────────────────────────────────────────────

const getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: { usuario }
        });
        
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR PERFIL
// ─────────────────────────────────────────────────────────────

const updateMe = async (req, res) => {
    try {
        const { tipo_documento, nombre, apellido, email, telefono, direccion } = req.body;
        
        const usuario = await Usuario.findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Validar email único
        if (email !== undefined && email !== usuario.email) {
            const { Op } = require('sequelize');
            const emailExistente = await Usuario.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: req.usuario.id }
                }
            });
            
            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado por otro usuario'
                });
            }
        }
        
        // Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (email !== undefined) usuario.email = email;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;
        if (tipo_documento !== undefined) usuario.tipo_documento = tipo_documento;
        
        // Manejar imagen
        if (req.file) {
            if (String(usuario.rol) !== 'profesional') {
                try {
                    deleteFile(req.file.filename);
                } catch (err) {
                    console.error('Error eliminando archivo no autorizado:', err);
                }
                return res.status(403).json({
                    success: false,
                    message: 'Solo los usuarios con rol profesional pueden subir imagen de perfil'
                });
            }
            
            if (usuario.imagen) {
                deleteFile(usuario.imagen);
            }
            usuario.imagen = req.file.filename;
        }
        
        await usuario.save();
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: usuario.toJSON()
            }
        });
        
    } catch (error) {
        console.error('Error en updateMe:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// CAMBIAR CONTRASEÑA
// ─────────────────────────────────────────────────────────────

const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        
        const cambioValid = validarCambioPassword(passwordActual, passwordNueva);
        if (!cambioValid.valid) {
            return res.status(400).json({ success: false, message: cambioValid.message });
        }
        
        const usuario = await Usuario.scope('withPassword').findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const passwordValida = await usuario.compararPassword(passwordActual);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }
        
        usuario.password = passwordNueva;
        await usuario.save();
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error en changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    changePassword
};